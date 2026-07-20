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

before(async () => {
  app = initializeApp({
    apiKey: 'demo-key',
    appId: '1:123456789:web:management-tests',
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

type SeedOptions = {
  appointmentId?: string;
  oldSlotId?: string;
  oldStartsAt?: Date;
  patientId: string;
  providerId?: string;
  targetSlotId?: string;
  targetStartsAt?: Date;
  targetStatus?: 'available' | 'blocked' | 'booked' | 'held';
};

async function seedAppointmentSurface(options: SeedOptions) {
  const appointmentId = options.appointmentId ?? 'alice-appointment';
  const oldSlotId = options.oldSlotId ?? 'old-slot';
  const targetSlotId = options.targetSlotId ?? 'target-slot';
  const providerId = options.providerId ?? 'lina-haddad';
  const oldStartsAt = options.oldStartsAt ?? new Date(Date.now() + 2 * 24 * 60 * 60 * 1_000);
  const targetStartsAt =
    options.targetStartsAt ?? new Date(oldStartsAt.getTime() + 24 * 60 * 60 * 1_000);
  const oldEndsAt = new Date(oldStartsAt.getTime() + 30 * 60 * 1_000);
  const targetEndsAt = new Date(targetStartsAt.getTime() + 30 * 60 * 1_000);
  const auditDate = new Date('2029-12-01T00:00:00.000Z');

  await testEnvironment.withSecurityRulesDisabled(async (context) => {
    const firestore = context.firestore();
    const batch = firestore.batch();

    batch.set(firestore.doc(`providers/${providerId}`), {
      clinicIds: ['marsa-family-clinic'],
      isActive: true,
      visitModes: ['in_person', 'video'],
    });
    batch.set(firestore.doc('clinics/marsa-family-clinic'), { isActive: true });
    batch.set(firestore.doc(`appointments/${appointmentId}`), {
      cancelledAt: null,
      cancelledBy: null,
      clinicId: 'marsa-family-clinic',
      createdAt: auditDate,
      endsAt: oldEndsAt,
      patientId: options.patientId,
      providerId,
      reasonCategory: 'routine_visit',
      schemaVersion: 1,
      slotId: oldSlotId,
      startsAt: oldStartsAt,
      status: 'confirmed',
      timezone: 'Asia/Dubai',
      updatedAt: auditDate,
      visitMode: 'in_person',
    });
    batch.set(firestore.doc(`availabilitySlots/${oldSlotId}`), {
      appointmentId,
      clinicId: 'marsa-family-clinic',
      createdAt: auditDate,
      endsAt: oldEndsAt,
      providerId,
      schemaVersion: 1,
      startsAt: oldStartsAt,
      status: 'booked',
      timezone: 'Asia/Dubai',
      updatedAt: auditDate,
      version: 1,
      visitMode: 'in_person',
    });
    batch.set(firestore.doc(`availabilitySlots/${targetSlotId}`), {
      appointmentId: options.targetStatus === 'booked' ? 'other-appointment' : null,
      clinicId: 'marsa-family-clinic',
      createdAt: auditDate,
      endsAt: targetEndsAt,
      providerId,
      schemaVersion: 1,
      startsAt: targetStartsAt,
      status: options.targetStatus ?? 'available',
      timezone: 'Asia/Dubai',
      updatedAt: auditDate,
      version: 1,
      visitMode: 'in_person',
    });

    await batch.commit();
  });

  return { appointmentId, oldSlotId, targetSlotId };
}

function callable(name: 'cancelAppointment' | 'rescheduleAppointment') {
  return httpsCallable(getFunctions(app, FUNCTION_REGION), name);
}

function hasFunctionCode(error: unknown, code: string) {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    error.code === `functions/${code}`
  );
}

async function readSurface(appointmentId: string, oldSlotId: string, targetSlotId: string) {
  let result:
    | {
        appointment: Record<string, unknown>;
        oldSlot: Record<string, unknown>;
        targetSlot: Record<string, unknown>;
      }
    | undefined;

  await testEnvironment.withSecurityRulesDisabled(async (context) => {
    const firestore = context.firestore();
    const [appointment, oldSlot, targetSlot] = await Promise.all([
      firestore.doc(`appointments/${appointmentId}`).get(),
      firestore.doc(`availabilitySlots/${oldSlotId}`).get(),
      firestore.doc(`availabilitySlots/${targetSlotId}`).get(),
    ]);

    result = {
      appointment: appointment.data() as Record<string, unknown>,
      oldSlot: oldSlot.data() as Record<string, unknown>,
      targetSlot: targetSlot.data() as Record<string, unknown>,
    };
  });

  if (!result) {
    throw new Error('Failed to inspect appointment management documents.');
  }

  return result;
}

describe('appointment management callables', () => {
  it('cancels atomically, records audit metadata, and safely replays', async () => {
    const patient = await signInNewPatient('cancel-success');
    const surface = await seedAppointmentSurface({ patientId: patient.uid });
    const request = { appointmentId: surface.appointmentId, requestId: randomUUID() };

    const first = await callable('cancelAppointment')(request);
    const second = await callable('cancelAppointment')(request);

    assert.equal((first.data as { isReplay?: unknown }).isReplay, false);
    assert.equal((second.data as { isReplay?: unknown }).isReplay, true);
    await assert.rejects(
      callable('cancelAppointment')({
        appointmentId: 'different-appointment',
        requestId: request.requestId,
      }),
      (error: unknown) => hasFunctionCode(error, 'failed-precondition'),
    );
    assert.equal(
      (first.data as { appointment: { status: string } }).appointment.status,
      'cancelled',
    );

    const documents = await readSurface(
      surface.appointmentId,
      surface.oldSlotId,
      surface.targetSlotId,
    );
    assert.equal(documents.appointment.status, 'cancelled');
    assert.equal(documents.appointment.cancelledBy, 'patient');
    assert.ok(documents.appointment.cancelledAt);
    assert.equal(documents.oldSlot.status, 'available');
    assert.equal(documents.oldSlot.appointmentId, null);
    assert.equal(documents.oldSlot.version, 2);
  });

  it('rejects cancellation inside the lead-time policy without changing state', async () => {
    const patient = await signInNewPatient('cancel-policy');
    const surface = await seedAppointmentSurface({
      oldStartsAt: new Date(Date.now() + 5 * 60 * 1_000),
      patientId: patient.uid,
    });

    await assert.rejects(
      callable('cancelAppointment')({
        appointmentId: surface.appointmentId,
        requestId: randomUUID(),
      }),
      (error: unknown) => hasFunctionCode(error, 'failed-precondition'),
    );

    const documents = await readSurface(
      surface.appointmentId,
      surface.oldSlotId,
      surface.targetSlotId,
    );
    assert.equal(documents.appointment.status, 'confirmed');
    assert.equal(documents.oldSlot.status, 'booked');
  });

  it('reschedules atomically, releases the old slot, reserves the target, and replays', async () => {
    const patient = await signInNewPatient('reschedule-success');
    const surface = await seedAppointmentSurface({ patientId: patient.uid });
    const request = {
      appointmentId: surface.appointmentId,
      requestId: randomUUID(),
      slotId: surface.targetSlotId,
    };

    const first = await callable('rescheduleAppointment')(request);
    const second = await callable('rescheduleAppointment')(request);

    assert.equal((first.data as { isReplay?: unknown }).isReplay, false);
    assert.equal((second.data as { isReplay?: unknown }).isReplay, true);
    assert.equal(
      (first.data as { appointment: { slotId: string } }).appointment.slotId,
      surface.targetSlotId,
    );

    const documents = await readSurface(
      surface.appointmentId,
      surface.oldSlotId,
      surface.targetSlotId,
    );
    assert.equal(documents.appointment.status, 'confirmed');
    assert.equal(documents.appointment.slotId, surface.targetSlotId);
    assert.equal(documents.oldSlot.status, 'available');
    assert.equal(documents.oldSlot.appointmentId, null);
    assert.equal(documents.oldSlot.version, 2);
    assert.equal(documents.targetSlot.status, 'booked');
    assert.equal(documents.targetSlot.appointmentId, surface.appointmentId);
    assert.equal(documents.targetSlot.version, 2);
  });

  it('rejects an occupied target or request-key payload conflict without a partial move', async () => {
    const patient = await signInNewPatient('reschedule-conflict');
    const surface = await seedAppointmentSurface({
      patientId: patient.uid,
      targetStatus: 'booked',
    });
    const requestId = randomUUID();

    await assert.rejects(
      callable('rescheduleAppointment')({
        appointmentId: surface.appointmentId,
        requestId,
        slotId: surface.targetSlotId,
      }),
      (error: unknown) => hasFunctionCode(error, 'already-exists'),
    );

    await seedAppointmentSurface({ patientId: patient.uid });
    await callable('rescheduleAppointment')({
      appointmentId: surface.appointmentId,
      requestId,
      slotId: surface.targetSlotId,
    });

    await assert.rejects(
      callable('rescheduleAppointment')({
        appointmentId: surface.appointmentId,
        requestId,
        slotId: surface.oldSlotId,
      }),
      (error: unknown) => hasFunctionCode(error, 'failed-precondition'),
    );
  });

  it('prevents another authenticated patient from managing the appointment', async () => {
    const owner = await signInNewPatient('management-owner');
    const surface = await seedAppointmentSurface({ patientId: owner.uid });
    await signOut(getAuth(app));
    await signInNewPatient('management-other');

    await assert.rejects(
      callable('cancelAppointment')({
        appointmentId: surface.appointmentId,
        requestId: randomUUID(),
      }),
      (error: unknown) => hasFunctionCode(error, 'permission-denied'),
    );
    await assert.rejects(
      callable('rescheduleAppointment')({
        appointmentId: surface.appointmentId,
        requestId: randomUUID(),
        slotId: surface.targetSlotId,
      }),
      (error: unknown) => hasFunctionCode(error, 'permission-denied'),
    );

    const documents = await readSurface(
      surface.appointmentId,
      surface.oldSlotId,
      surface.targetSlotId,
    );
    assert.equal(documents.appointment.status, 'confirmed');
    assert.equal(documents.oldSlot.status, 'booked');
    assert.equal(documents.targetSlot.status, 'available');
  });
});
