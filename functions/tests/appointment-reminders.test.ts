import { initializeTestEnvironment, type RulesTestEnvironment } from '@firebase/rules-unit-testing';
import assert from 'node:assert/strict';
import { after, before, beforeEach, describe, it } from 'node:test';

import { deleteApp, initializeApp } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';

import {
  deriveReminderId,
  sendAppointmentReminders,
  type AppointmentReminderRunResult,
} from '../src/notifications/send-appointment-reminders.js';

const PROJECT_ID = 'demo-hakeemi';
const now = Timestamp.fromDate(new Date('2030-01-01T08:00:00.000Z'));
const appointmentId = 'appointment-reminder-1';
const token = 'fcm-token-for-reminder-test-123456';

let testEnvironment: RulesTestEnvironment;
let adminApp: ReturnType<typeof initializeApp>;

before(async () => {
  adminApp = initializeApp({ projectId: PROJECT_ID }, 'appointment-reminder-test');
  testEnvironment = await initializeTestEnvironment({ projectId: PROJECT_ID });
});

beforeEach(async () => {
  await testEnvironment.clearFirestore();
  const firestore = getFirestore(adminApp);
  const startsAt = Timestamp.fromMillis(now.toMillis() + 24 * 60 * 60 * 1_000);
  const endsAt = Timestamp.fromMillis(startsAt.toMillis() + 30 * 60 * 1_000);

  await firestore.doc(`appointments/${appointmentId}`).set({
    cancelledAt: null,
    cancelledBy: null,
    clinicId: 'marsa-family-clinic',
    createdAt: now,
    endsAt,
    patientId: 'patient-reminder-1',
    providerId: 'lina-haddad',
    reasonCategory: 'routine_visit',
    schemaVersion: 1,
    slotId: 'slot-reminder-1',
    startsAt,
    status: 'confirmed',
    timezone: 'Asia/Dubai',
    updatedAt: now,
    visitMode: 'in_person',
  });
  await firestore.doc('users/patient-reminder-1/deviceTokens/token-1').set({
    createdAt: now,
    enabled: true,
    locale: 'en',
    platform: 'android',
    token,
    updatedAt: now,
  });
});

after(async () => {
  await testEnvironment.cleanup();
  await deleteApp(adminApp);
});

describe('scheduled appointment reminders', () => {
  it('sends once, records a receipt, and safely skips the next retry', async () => {
    const messages: unknown[] = [];
    const messaging = {
      sendEachForMulticast: async (message: unknown) => {
        messages.push(message);
        return {
          failureCount: 0,
          responses: [{ messageId: 'message-1', success: true }],
          successCount: 1,
        };
      },
    } as never;

    const first = await sendAppointmentReminders(getFirestore(adminApp), messaging, now);
    const second = await sendAppointmentReminders(getFirestore(adminApp), messaging, now);

    assert.deepEqual(first, {
      considered: 1,
      failed: 0,
      sent: 1,
      skipped: 0,
    } satisfies AppointmentReminderRunResult);
    assert.deepEqual(second, {
      considered: 1,
      failed: 0,
      sent: 0,
      skipped: 1,
    } satisfies AppointmentReminderRunResult);
    assert.equal(messages.length, 1);
    assert.deepEqual((messages[0] as { data: Record<string, string> }).data, {
      appointmentId,
      type: 'appointment_reminder',
    });

    const receipt = await getFirestore(adminApp)
      .doc(`appointmentReminders/${deriveReminderId(appointmentId)}`)
      .get();
    assert.equal(receipt.data()?.status, 'sent');
  });
});
