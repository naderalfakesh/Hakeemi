import { initializeTestEnvironment, type RulesTestEnvironment } from '@firebase/rules-unit-testing';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { after, before, beforeEach, describe, it } from 'node:test';

import { deleteApp, initializeApp, type FirebaseApp } from 'firebase/app';
import {
  connectAuthEmulator,
  createUserWithEmailAndPassword,
  getAuth,
  signOut,
} from 'firebase/auth';
import { connectFunctionsEmulator, getFunctions, httpsCallable } from 'firebase/functions';

const PROJECT_ID = 'demo-hakeemi';
const FUNCTION_REGION = 'me-central1';
const PASSWORD = 'portfolio-test-password';

let app: FirebaseApp;
let testEnvironment: RulesTestEnvironment;

type SlotOverrides = {
  appointmentId?: string | null;
  clinicId?: string | null;
  endsAt?: Date;
  providerId?: string;
  startsAt?: Date;
  status?: 'available' | 'blocked' | 'booked' | 'held';
  version?: number;
  visitMode?: 'in_person' | 'video';
};

before(async () => {
  app = initializeApp({
    apiKey: 'demo-key',
    appId: '1:123456789:web:booking-tests',
    projectId: PROJECT_ID,
  });

  connectAuthEmulator(getAuth(app), 'http://127.0.0.1:9099', { disableWarnings: true });
  connectFunctionsEmulator(getFunctions(app, FUNCTION_REGION), '127.0.0.1', 5001);
  testEnvironment = await initializeTestEnvironment({ projectId: PROJECT_ID });
});

beforeEach(async () => {
  if (getAuth(app).currentUser) {
    await signOut(getAuth(app));
  }

  await testEnvironment.clearFirestore();
});

after(async () => {
  await Promise.all([testEnvironment.cleanup(), deleteApp(app)]);
});

async function signInNewPatient(label: string) {
  const credential = await createUserWithEmailAndPassword(
    getAuth(app),
    `${label}-${randomUUID()}@example.test`,
    PASSWORD,
  );

  return credential.user;
}

async function seedBookingSurface(
  slotId: string,
  slotOverrides: SlotOverrides = {},
  providerOverrides: Record<string, unknown> = {},
) {
  const startsAt = slotOverrides.startsAt ?? new Date(Date.now() + 2 * 24 * 60 * 60 * 1_000);
  const endsAt = slotOverrides.endsAt ?? new Date(startsAt.getTime() + 30 * 60 * 1_000);
  const status = slotOverrides.status ?? 'available';
  const appointmentId =
    slotOverrides.appointmentId ?? (status === 'booked' ? 'existing-appointment' : null);

  await testEnvironment.withSecurityRulesDisabled(async (context) => {
    const firestore = context.firestore();
    const batch = firestore.batch();
    const auditDate = new Date('2029-12-01T00:00:00.000Z');

    batch.set(firestore.doc('providers/lina-haddad'), {
      clinicIds: ['marsa-family-clinic'],
      isActive: true,
      visitModes: ['in_person', 'video'],
      ...providerOverrides,
    });
    batch.set(firestore.doc('clinics/marsa-family-clinic'), { isActive: true });
    batch.set(firestore.doc('clinics/unowned-clinic'), { isActive: true });
    batch.set(firestore.doc(`availabilitySlots/${slotId}`), {
      appointmentId,
      clinicId: slotOverrides.clinicId ?? 'marsa-family-clinic',
      createdAt: auditDate,
      endsAt,
      providerId: slotOverrides.providerId ?? 'lina-haddad',
      schemaVersion: 1,
      startsAt,
      status,
      timezone: 'Asia/Dubai',
      updatedAt: auditDate,
      version: slotOverrides.version ?? 1,
      visitMode: slotOverrides.visitMode ?? 'in_person',
    });

    await batch.commit();
  });
}

function bookingCallable() {
  return httpsCallable(getFunctions(app, FUNCTION_REGION), 'bookAppointment');
}

function bookingRequest(slotId: string, requestId = randomUUID()) {
  return {
    reasonCategory: 'routine_visit',
    requestId,
    slotId,
  };
}

function hasFunctionCode(error: unknown, code: string) {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    error.code === `functions/${code}`
  );
}

async function readAllBookingDocuments() {
  let result:
    | {
        appointments: { data: Record<string, unknown>; id: string }[];
        slots: { data: Record<string, unknown>; id: string }[];
      }
    | undefined;

  await testEnvironment.withSecurityRulesDisabled(async (context) => {
    const firestore = context.firestore();
    const [appointments, slots] = await Promise.all([
      firestore.collection('appointments').get(),
      firestore.collection('availabilitySlots').get(),
    ]);

    result = {
      appointments: appointments.docs.map((snapshot) => ({
        data: snapshot.data(),
        id: snapshot.id,
      })),
      slots: slots.docs.map((snapshot) => ({ data: snapshot.data(), id: snapshot.id })),
    };
  });

  if (!result) {
    throw new Error('Failed to inspect booking documents.');
  }

  return result;
}

describe('bookAppointment callable', () => {
  it('atomically books a slot and safely replays the same request', async () => {
    const slotId = 'success-slot';
    const requestId = randomUUID();
    await seedBookingSurface(slotId);
    const patient = await signInNewPatient('booking-success');
    const request = bookingRequest(slotId, requestId);
    const callable = bookingCallable();

    const first = await callable(request);
    const second = await callable(request);

    assert.equal((first.data as { isReplay?: unknown }).isReplay, false);
    assert.equal((second.data as { isReplay?: unknown }).isReplay, true);
    assert.deepEqual(second.data, { ...(first.data as object), isReplay: true });

    const documents = await readAllBookingDocuments();
    assert.equal(documents.appointments.length, 1);
    assert.equal(documents.slots.length, 1);

    const appointment = documents.appointments[0];
    const slot = documents.slots[0];
    assert.ok(appointment);
    assert.ok(slot);
    assert.equal(appointment.data.patientId, patient.uid);
    assert.equal(appointment.data.status, 'confirmed');
    assert.equal(appointment.data.slotId, slotId);
    assert.ok(appointment.data.createdAt);
    assert.equal(slot.data.status, 'booked');
    assert.equal(slot.data.appointmentId, appointment.id);
    assert.equal(slot.data.version, 2);

    await assert.rejects(callable({ ...request, reasonCategory: 'follow_up' }), (error: unknown) =>
      hasFunctionCode(error, 'failed-precondition'),
    );
  });

  it('allows only one of two simultaneous requests to reserve a slot', async () => {
    const slotId = 'contended-slot';
    await seedBookingSurface(slotId);
    await signInNewPatient('booking-contention');
    const callable = bookingCallable();

    const results = await Promise.allSettled([
      callable(bookingRequest(slotId)),
      callable(bookingRequest(slotId)),
    ]);
    const fulfilled = results.filter((result) => result.status === 'fulfilled');
    const rejected = results.filter((result) => result.status === 'rejected');

    assert.equal(fulfilled.length, 1);
    assert.equal(rejected.length, 1);
    assert.ok(rejected[0]?.status === 'rejected');
    assert.equal(hasFunctionCode(rejected[0].reason, 'already-exists'), true);

    const documents = await readAllBookingDocuments();
    assert.equal(documents.appointments.length, 1);
    assert.equal(documents.slots[0]?.data.status, 'booked');
    assert.equal(documents.slots[0]?.data.appointmentId, documents.appointments[0]?.id);
  });

  it('rejects slots outside the supported booking window', async () => {
    await signInNewPatient('booking-window');
    const callable = bookingCallable();
    const closeStart = new Date(Date.now() + 5 * 60 * 1_000);
    const distantStart = new Date(Date.now() + 91 * 24 * 60 * 60 * 1_000);

    await seedBookingSurface('close-slot', { startsAt: closeStart });
    await assert.rejects(callable(bookingRequest('close-slot')), (error: unknown) =>
      hasFunctionCode(error, 'failed-precondition'),
    );

    await seedBookingSurface('distant-slot', { startsAt: distantStart });
    await assert.rejects(callable(bookingRequest('distant-slot')), (error: unknown) =>
      hasFunctionCode(error, 'failed-precondition'),
    );

    assert.equal((await readAllBookingDocuments()).appointments.length, 0);
  });

  it('rejects invalid provider ownership and inactive providers', async () => {
    await signInNewPatient('booking-ownership');
    const callable = bookingCallable();

    await seedBookingSurface('unowned-slot', { clinicId: 'unowned-clinic' });
    await assert.rejects(callable(bookingRequest('unowned-slot')), (error: unknown) =>
      hasFunctionCode(error, 'failed-precondition'),
    );

    await seedBookingSurface('inactive-slot', {}, { isActive: false });
    await assert.rejects(callable(bookingRequest('inactive-slot')), (error: unknown) =>
      hasFunctionCode(error, 'failed-precondition'),
    );

    assert.equal((await readAllBookingDocuments()).appointments.length, 0);
  });

  it('rejects missing slots and forged patient identity fields', async () => {
    await signInNewPatient('booking-input');
    const callable = bookingCallable();

    await assert.rejects(callable(bookingRequest('missing-slot')), (error: unknown) =>
      hasFunctionCode(error, 'not-found'),
    );

    await seedBookingSurface('forged-slot');
    await assert.rejects(
      callable({ ...bookingRequest('forged-slot'), patientId: 'another-user' }),
      (error: unknown) => hasFunctionCode(error, 'invalid-argument'),
    );

    assert.equal((await readAllBookingDocuments()).appointments.length, 0);
  });

  it('requires an authenticated Firebase user', async () => {
    await seedBookingSurface('anonymous-slot');

    await assert.rejects(bookingCallable()(bookingRequest('anonymous-slot')), (error: unknown) =>
      hasFunctionCode(error, 'unauthenticated'),
    );

    assert.equal((await readAllBookingDocuments()).appointments.length, 0);
  });
});
