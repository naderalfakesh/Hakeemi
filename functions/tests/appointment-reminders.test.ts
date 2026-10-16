import { initializeTestEnvironment, type RulesTestEnvironment } from '@firebase/rules-unit-testing';
import assert from 'node:assert/strict';
import { after, before, beforeEach, describe, it } from 'node:test';

import { deleteApp, initializeApp } from 'firebase-admin/app';
import { DocumentReference, getFirestore, Timestamp, WriteBatch } from 'firebase-admin/firestore';

import { registerDeviceToken } from '../src/notifications/register-device-token.js';
import { unregisterDeviceToken } from '../src/notifications/unregister-device-token.js';
import {
  APPOINTMENT_REMINDER_MAX_ATTEMPTS,
  deriveReminderId,
  sendAppointmentReminders,
  type AppointmentReminderRunResult,
  type ReminderLogger,
} from '../src/notifications/send-appointment-reminders.js';

const PROJECT_ID = 'demo-hakeemi';
const now = Timestamp.fromDate(new Date('2030-01-01T08:00:00.000Z'));
const appointmentId = 'appointment-reminder-1';
const patientId = 'patient-reminder-1';
const token = 'fcm-token-for-reminder-test-123456';
const patientEmail = 'reminder-patient@example.com';
const laterRun = (minutes: number) => Timestamp.fromMillis(now.toMillis() + minutes * 60 * 1_000);

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

  await seedConfirmedAppointment(firestore, appointmentId, patientId, startsAt, endsAt);
  await firestore.doc(`users/${patientId}`).set({
    createdAt: now,
    displayName: 'Reminder Patient',
    email: patientEmail,
    photoURL: null,
    updatedAt: now,
  });
  await firestore.doc(`users/${patientId}/deviceTokens/token-1`).set({
    createdAt: now,
    enabled: true,
    locale: 'en',
    platform: 'android',
    token,
    updatedAt: now,
  });
});

async function seedConfirmedAppointment(
  firestore: ReturnType<typeof getFirestore>,
  id: string,
  ownerId: string,
  startsAt: Timestamp,
  endsAt: Timestamp,
) {
  await firestore.doc(`appointments/${id}`).set({
    cancelledAt: null,
    cancelledBy: null,
    clinicId: 'marsa-family-clinic',
    createdAt: now,
    endsAt,
    patientId: ownerId,
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
}

type StubResponse = { error?: { code: string; message: string }; success: boolean };
type StubBehaviour = (message: { tokens: string[] }, call: number) => StubResponse[];

const deliverAll: StubBehaviour = (message) =>
  message.tokens.map((_, index) => ({ messageId: `message-${index}`, success: true }));

function createMessagingStub(messages: unknown[], behaviour: StubBehaviour = deliverAll) {
  return {
    sendEachForMulticast: async (message: { tokens: string[] }) => {
      messages.push(message);
      const responses = behaviour(message, messages.length);

      return {
        failureCount: responses.filter((response) => !response.success).length,
        responses,
        successCount: responses.filter((response) => response.success).length,
      };
    },
  } as never;
}

function failUntilCall(succeedFromCall: number, code: string): StubBehaviour {
  return (message, call) => {
    if (call < succeedFromCall) {
      throw Object.assign(new Error(`FCM rejected ${message.tokens.join(',')}`), { code });
    }

    return deliverAll(message, call);
  };
}

function createLogCapture() {
  const entries: { fields: Record<string, unknown>; level: string; message: string }[] = [];
  const record = (level: string) => (message: string, fields: Record<string, unknown>) =>
    entries.push({ fields, level, message });
  const logger: ReminderLogger = {
    error: record('error'),
    info: record('info'),
    warn: record('warn'),
  };

  return { entries, logger };
}

const transientFirestoreError = () =>
  Object.assign(new Error('14 UNAVAILABLE: transient'), { code: 14 });

// Rejects the first receipt `update` whose payload satisfies `matches`, then
// restores the real method. Returns a function reporting whether it fired.
function failNextReceiptUpdate(matches: (payload: Record<string, unknown>) => boolean) {
  const original = DocumentReference.prototype.update;
  let fired = false;

  DocumentReference.prototype.update = function (this: DocumentReference, ...args: unknown[]) {
    const payload = args[0];

    if (
      !fired &&
      this.path.startsWith('appointmentReminders/') &&
      typeof payload === 'object' &&
      payload !== null &&
      matches(payload as Record<string, unknown>)
    ) {
      fired = true;
      DocumentReference.prototype.update = original;
      return Promise.reject(transientFirestoreError());
    }

    return (original as unknown as (...rest: unknown[]) => Promise<unknown>).apply(this, args);
  } as typeof DocumentReference.prototype.update;

  return () => {
    DocumentReference.prototype.update = original;
    return fired;
  };
}

// Rejects the first batch commit that touches a device-token record (the
// post-send token cleanup), then restores the real method.
function failNextTokenCleanupCommit() {
  const original = WriteBatch.prototype.commit;
  let fired = false;

  WriteBatch.prototype.commit = function (this: WriteBatch) {
    const operations = (this as unknown as { _ops: { docPath: string }[] })._ops;

    if (!fired && operations.some((operation) => operation.docPath.includes('/deviceTokens/'))) {
      fired = true;
      WriteBatch.prototype.commit = original;
      return Promise.reject(transientFirestoreError());
    }

    return original.apply(this);
  } as typeof WriteBatch.prototype.commit;

  return () => {
    WriteBatch.prototype.commit = original;
    return fired;
  };
}

async function seedLegacyReceipt(
  firestore: ReturnType<typeof getFirestore>,
  id: string,
  status: 'failed' | 'sending',
  at: Timestamp,
) {
  await firestore.doc(`appointmentReminders/${deriveReminderId(id)}`).set({
    appointmentId: id,
    claimedAt: at,
    createdAt: at,
    status,
    updatedAt: at,
  });
}

async function readReceipt(firestore: ReturnType<typeof getFirestore>, id = appointmentId) {
  const snapshot = await firestore.doc(`appointmentReminders/${deriveReminderId(id)}`).get();

  return snapshot.data() ?? {};
}

after(async () => {
  await testEnvironment.cleanup();
  await deleteApp(adminApp);
});

describe('scheduled appointment reminders', () => {
  it('sends once, records a receipt, and safely skips the next retry', async () => {
    const messages: unknown[] = [];
    const messaging = createMessagingStub(messages);

    const first = await sendAppointmentReminders(getFirestore(adminApp), messaging, now);
    const second = await sendAppointmentReminders(getFirestore(adminApp), messaging, now);

    assert.deepEqual(first, {
      abandoned: 0,
      considered: 1,
      failed: 0,
      retried: 0,
      sent: 1,
      skipped: 0,
    } satisfies AppointmentReminderRunResult);
    assert.deepEqual(second, {
      abandoned: 0,
      considered: 1,
      failed: 0,
      retried: 0,
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

  it('stops reminding the previous account once another account registers the same device token', async () => {
    const firestore = getFirestore(adminApp);
    const nextPatientId = 'patient-reminder-2';
    const startsAt = Timestamp.fromMillis(now.toMillis() + 24 * 60 * 60 * 1_000);
    const endsAt = Timestamp.fromMillis(startsAt.toMillis() + 30 * 60 * 1_000);
    await seedConfirmedAppointment(
      firestore,
      'appointment-reminder-2',
      nextPatientId,
      startsAt,
      endsAt,
    );

    // Account A registered the device through the callable transaction; the legacy
    // `token-1` record seeded above represents an older registration of the same token.
    await registerDeviceToken(firestore, patientId, {
      enabled: true,
      locale: 'en',
      platform: 'android',
      token,
    });
    // Account B signs in on the same device and registers the same token.
    await registerDeviceToken(firestore, nextPatientId, {
      enabled: true,
      locale: 'ar',
      platform: 'android',
      token,
    });

    const messages: { tokens: string[]; data: Record<string, string> }[] = [];
    const result = await sendAppointmentReminders(firestore, createMessagingStub(messages), now);

    assert.deepEqual(result, {
      abandoned: 0,
      considered: 2,
      failed: 0,
      retried: 0,
      sent: 1,
      skipped: 1,
    } satisfies AppointmentReminderRunResult);
    assert.equal(messages.length, 1);
    assert.deepEqual(messages[0]?.data, {
      appointmentId: 'appointment-reminder-2',
      type: 'appointment_reminder',
    });
    assert.deepEqual(messages[0]?.tokens, [token]);

    const previousAccountTokens = await firestore
      .collection(`users/${patientId}/deviceTokens`)
      .where('enabled', '==', true)
      .get();
    assert.equal(previousAccountTokens.size, 0);
    const receipt = await firestore
      .doc(`appointmentReminders/${deriveReminderId(appointmentId)}`)
      .get();
    assert.equal(receipt.data()?.status, 'skipped');
  });

  it('sends nothing to an account whose online sign-out disabled its device registration', async () => {
    const firestore = getFirestore(adminApp);
    await registerDeviceToken(firestore, patientId, {
      enabled: true,
      locale: 'en',
      platform: 'ios',
      token,
    });
    const enabledBefore = await firestore
      .collection(`users/${patientId}/deviceTokens`)
      .where('enabled', '==', true)
      .get();
    // The callable registration superseded the older `token-1` fixture record of the
    // same token, so the account holds exactly one enabled registration.
    assert.equal(enabledBefore.size, 1);

    // Sign-out while online: the client presents the raw token for its own account.
    const signOut = await unregisterDeviceToken(firestore, patientId, { token });
    assert.equal(signOut.disabled, true);
    const retry = await unregisterDeviceToken(firestore, patientId, { token });
    assert.equal(retry.disabled, false);

    const messages: unknown[] = [];
    const result = await sendAppointmentReminders(firestore, createMessagingStub(messages), now);

    assert.deepEqual(result, {
      abandoned: 0,
      considered: 1,
      failed: 0,
      retried: 0,
      sent: 0,
      skipped: 1,
    } satisfies AppointmentReminderRunResult);
    assert.equal(messages.length, 0);
    const receipt = await firestore
      .doc(`appointmentReminders/${deriveReminderId(appointmentId)}`)
      .get();
    assert.equal(receipt.data()?.status, 'skipped');
  });

  it('retries a failed delivery on a later run and never resends a delivered reminder', async () => {
    const firestore = getFirestore(adminApp);
    const messages: { tokens: string[] }[] = [];
    const messaging = createMessagingStub(messages, failUntilCall(2, 'messaging/internal-error'));
    const { entries, logger } = createLogCapture();

    const first = await sendAppointmentReminders(firestore, messaging, now, { logger });
    assert.deepEqual(first, {
      abandoned: 0,
      considered: 1,
      failed: 1,
      retried: 0,
      sent: 0,
      skipped: 0,
    } satisfies AppointmentReminderRunResult);
    const failedReceipt = await readReceipt(firestore);
    assert.equal(failedReceipt.status, 'failed');
    assert.equal(failedReceipt.attempts, 1);
    assert.equal(failedReceipt.outcomeCode, 'messaging/internal-error');

    // The 15-minute window has moved on; only the failed receipt brings it back.
    const second = await sendAppointmentReminders(firestore, messaging, laterRun(15), { logger });
    assert.deepEqual(second, {
      abandoned: 0,
      considered: 0,
      failed: 0,
      retried: 1,
      sent: 1,
      skipped: 0,
    } satisfies AppointmentReminderRunResult);
    const sentReceipt = await readReceipt(firestore);
    assert.equal(sentReceipt.status, 'sent');
    assert.equal(sentReceipt.attempts, 2);
    assert.equal(sentReceipt.outcomeCode, 'delivered');

    const third = await sendAppointmentReminders(firestore, messaging, laterRun(30), { logger });
    assert.deepEqual(third, {
      abandoned: 0,
      considered: 0,
      failed: 0,
      retried: 0,
      sent: 0,
      skipped: 0,
    } satisfies AppointmentReminderRunResult);
    assert.equal(messages.length, 2);
    assert.deepEqual(messages[1]?.tokens, [token]);

    const failureLog = entries.find(
      (entry) => entry.message === 'appointment reminder delivery failed',
    );
    assert.equal(failureLog?.level, 'warn');
    assert.deepEqual(failureLog?.fields, {
      attempt: 1,
      delivered: 0,
      errorCode: 'messaging/internal-error',
      maxAttempts: APPOINTMENT_REMINDER_MAX_ATTEMPTS,
      reminderId: deriveReminderId(appointmentId),
      retryable: true,
      status: 'failed',
      willRetry: true,
    });
    const serializedLogs = JSON.stringify(entries);
    for (const secret of [
      token,
      patientEmail,
      patientId,
      appointmentId,
      'lina-haddad',
      'routine_visit',
      'marsa-family-clinic',
      'FCM rejected',
    ]) {
      assert.equal(serializedLogs.includes(secret), false, `logs must not contain ${secret}`);
    }
    assert.equal(
      entries.filter((entry) => entry.message === 'appointment reminder run complete').length,
      3,
    );
  });

  it('abandons a reminder after the maximum number of delivery attempts', async () => {
    const firestore = getFirestore(adminApp);
    const messages: unknown[] = [];
    const messaging = createMessagingStub(
      messages,
      failUntilCall(Number.POSITIVE_INFINITY, 'messaging/server-unavailable'),
    );
    const { entries, logger } = createLogCapture();
    const outcomes: AppointmentReminderRunResult[] = [];

    for (let run = 0; run <= APPOINTMENT_REMINDER_MAX_ATTEMPTS; run += 1) {
      outcomes.push(
        await sendAppointmentReminders(firestore, messaging, laterRun(run * 15), { logger }),
      );
    }

    assert.deepEqual(
      outcomes.map((outcome) => [outcome.retried, outcome.failed, outcome.abandoned]),
      [
        [0, 1, 0],
        [1, 1, 0],
        [1, 0, 1],
        [0, 0, 0],
      ],
    );
    assert.equal(messages.length, APPOINTMENT_REMINDER_MAX_ATTEMPTS);
    const receipt = await readReceipt(firestore);
    assert.equal(receipt.status, 'abandoned');
    assert.equal(receipt.attempts, APPOINTMENT_REMINDER_MAX_ATTEMPTS);
    assert.equal(receipt.outcomeCode, 'messaging/server-unavailable');
    const abandonLog = entries.find((entry) => entry.level === 'error');
    assert.equal(abandonLog?.fields.attempt, APPOINTMENT_REMINDER_MAX_ATTEMPTS);
    assert.equal(abandonLog?.fields.willRetry, false);
    assert.equal(JSON.stringify(entries).includes(token), false);
  });

  it('does not retry credential or permission failures', async () => {
    const firestore = getFirestore(adminApp);
    const messages: unknown[] = [];
    const messaging = createMessagingStub(
      messages,
      failUntilCall(Number.POSITIVE_INFINITY, 'messaging/third-party-auth-error'),
    );
    const { entries, logger } = createLogCapture();

    const first = await sendAppointmentReminders(firestore, messaging, now, { logger });
    const second = await sendAppointmentReminders(firestore, messaging, laterRun(15), { logger });

    assert.equal(first.abandoned, 1);
    assert.equal(first.failed, 0);
    assert.equal(second.retried, 0);
    assert.equal(messages.length, 1);
    const receipt = await readReceipt(firestore);
    assert.equal(receipt.status, 'abandoned');
    assert.equal(receipt.attempts, 1);
    assert.equal(receipt.outcomeCode, 'messaging/third-party-auth-error');
    assert.equal(entries.find((entry) => entry.level === 'error')?.fields.retryable, false);
  });

  it('skips a pending retry once the appointment is no longer confirmed', async () => {
    const firestore = getFirestore(adminApp);
    const messages: unknown[] = [];
    const messaging = createMessagingStub(messages, failUntilCall(2, 'messaging/internal-error'));
    const { entries, logger } = createLogCapture();

    await sendAppointmentReminders(firestore, messaging, now, { logger });
    await firestore.doc(`appointments/${appointmentId}`).update({
      cancelledAt: laterRun(5),
      cancelledBy: 'patient',
      status: 'cancelled',
      updatedAt: laterRun(5),
    });
    const second = await sendAppointmentReminders(firestore, messaging, laterRun(15), { logger });

    assert.deepEqual(second, {
      abandoned: 0,
      considered: 0,
      failed: 0,
      retried: 0,
      sent: 0,
      skipped: 1,
    } satisfies AppointmentReminderRunResult);
    assert.equal(messages.length, 1);
    const receipt = await readReceipt(firestore);
    assert.equal(receipt.status, 'skipped');
    assert.equal(receipt.outcomeCode, 'appointment-not-confirmed');
    assert.deepEqual(
      entries.find((entry) => entry.message === 'appointment reminder retry skipped')?.fields,
      { reason: 'appointment-not-confirmed', reminderId: deriveReminderId(appointmentId) },
    );
  });

  it('sends Arabic copy to Arabic-locale devices and English copy to the rest', async () => {
    const firestore = getFirestore(adminApp);
    const arabicToken = 'fcm-token-for-arabic-device-7654321';
    await firestore.doc(`users/${patientId}/deviceTokens/token-2`).set({
      createdAt: now,
      enabled: true,
      locale: 'ar-SA',
      platform: 'ios',
      token: arabicToken,
      updatedAt: now,
    });
    const messages: { notification: { body: string; title: string }; tokens: string[] }[] = [];
    const { logger } = createLogCapture();

    const result = await sendAppointmentReminders(firestore, createMessagingStub(messages), now, {
      logger,
    });

    assert.equal(result.sent, 1);
    assert.equal(messages.length, 2);
    const byToken = new Map(
      messages.map((message) => [message.tokens.join(','), message.notification]),
    );
    assert.deepEqual(byToken.get(token), {
      body: 'You have a Hakeemi appointment coming up.',
      title: 'Appointment reminder',
    });
    assert.deepEqual(byToken.get(arabicToken), {
      body: 'لديك موعد قادم في «حكيمي».',
      title: 'تذكير بالموعد',
    });
    for (const message of messages) {
      const copy = `${message.notification.title} ${message.notification.body}`;
      assert.equal(copy.includes('lina'), false);
      assert.equal(copy.includes(patientEmail), false);
      assert.equal(copy.includes(appointmentId), false);
    }
    assert.equal((await readReceipt(firestore)).status, 'sent');
  });

  it('skips a reminder whose only device tokens FCM rejects and disables them', async () => {
    const firestore = getFirestore(adminApp);
    const messages: unknown[] = [];
    const messaging = createMessagingStub(messages, (message) =>
      message.tokens.map(() => ({
        error: { code: 'messaging/registration-token-not-registered', message: 'gone' },
        success: false,
      })),
    );
    const { entries, logger } = createLogCapture();

    const first = await sendAppointmentReminders(firestore, messaging, now, { logger });
    const second = await sendAppointmentReminders(firestore, messaging, laterRun(15), { logger });

    assert.equal(first.skipped, 1);
    assert.equal(first.failed, 0);
    assert.equal(second.retried, 0);
    assert.equal(messages.length, 1);
    const receipt = await readReceipt(firestore);
    assert.equal(receipt.status, 'skipped');
    assert.equal(receipt.outcomeCode, 'no-valid-tokens');
    const tokenRecord = await firestore.doc(`users/${patientId}/deviceTokens/token-1`).get();
    assert.equal(tokenRecord.data()?.enabled, false);
    assert.equal(entries.find((entry) => entry.level === 'warn')?.fields.disabledTokens, 1);
    assert.equal(JSON.stringify(entries).includes(token), false);
  });

  it('keeps a delivered reminder when the receipt write fails afterwards and never resends it', async () => {
    const firestore = getFirestore(adminApp);
    const messages: { tokens: string[] }[] = [];
    const messaging = createMessagingStub(messages);
    const { entries, logger } = createLogCapture();
    // Start seven minutes later than the fixture so the appointment is still inside
    // the window of a run made after the ten-minute claim lease has expired.
    const startsAt = Timestamp.fromMillis(now.toMillis() + (24 * 60 + 7) * 60 * 1_000);
    await firestore.doc(`appointments/${appointmentId}`).update({
      endsAt: Timestamp.fromMillis(startsAt.toMillis() + 30 * 60 * 1_000),
      startsAt,
    });
    const restore = failNextReceiptUpdate((payload) => payload.status === 'sent');

    let first;
    try {
      first = await sendAppointmentReminders(firestore, messaging, now, { logger });
    } finally {
      assert.equal(restore(), true);
    }

    assert.deepEqual(first, {
      abandoned: 0,
      considered: 1,
      failed: 0,
      retried: 0,
      sent: 1,
      skipped: 0,
    } satisfies AppointmentReminderRunResult);
    const stuck = await readReceipt(firestore);
    assert.equal(stuck.status, 'sending');
    assert.equal(stuck.attempts, 1);
    assert.ok(stuck.sendIssuedAt instanceof Timestamp);
    assert.deepEqual(
      entries.find((entry) => entry.message === 'appointment reminder receipt update failed')
        ?.fields,
      {
        attempt: 1,
        delivered: 1,
        errorCode: 'grpc/14',
        intendedStatus: 'sent',
        reminderId: deriveReminderId(appointmentId),
        sendIssued: true,
      },
    );

    // Neither the retry pass nor the window pass (lease expired, still in window) claims it.
    const second = await sendAppointmentReminders(firestore, messaging, laterRun(15), { logger });
    const third = await sendAppointmentReminders(firestore, messaging, laterRun(10), { logger });
    assert.equal(second.retried + second.sent + third.retried + third.sent, 0);
    assert.equal(third.considered, 1);
    assert.equal(third.skipped, 1);
    assert.equal(messages.length, 1);
    assert.equal((await readReceipt(firestore)).status, 'sending');
    assert.equal(JSON.stringify(entries).includes(token), false);
  });

  it('retries safely when the pre-send marker write fails, delivering exactly once', async () => {
    const firestore = getFirestore(adminApp);
    const messages: { tokens: string[] }[] = [];
    const messaging = createMessagingStub(messages);
    const { logger } = createLogCapture();
    const restore = failNextReceiptUpdate((payload) => 'sendIssuedAt' in payload);

    let first;
    try {
      first = await sendAppointmentReminders(firestore, messaging, now, { logger });
    } finally {
      assert.equal(restore(), true);
    }

    assert.equal(first.failed, 1);
    assert.equal(messages.length, 0);
    const failed = await readReceipt(firestore);
    assert.equal(failed.status, 'failed');
    assert.equal(failed.outcomeCode, 'grpc/14');

    const second = await sendAppointmentReminders(firestore, messaging, laterRun(15), { logger });
    assert.equal(second.retried, 1);
    assert.equal(second.sent, 1);
    assert.equal(messages.length, 1);
    const sent = await readReceipt(firestore);
    assert.equal(sent.status, 'sent');
    assert.equal(sent.attempts, 2);
    assert.ok(sent.sendIssuedAt instanceof Timestamp);
  });

  it('keeps a delivered reminder when the token cleanup commit fails afterwards', async () => {
    const firestore = getFirestore(adminApp);
    const deadToken = 'fcm-token-for-dead-device-1234567890';
    await firestore.doc(`users/${patientId}/deviceTokens/token-2`).set({
      createdAt: now,
      enabled: true,
      locale: 'en',
      platform: 'ios',
      token: deadToken,
      updatedAt: now,
    });
    const messages: { tokens: string[] }[] = [];
    const messaging = createMessagingStub(messages, (message) =>
      message.tokens.map((entry) =>
        entry === deadToken
          ? {
              error: { code: 'messaging/registration-token-not-registered', message: 'gone' },
              success: false,
            }
          : { success: true },
      ),
    );
    const { entries, logger } = createLogCapture();
    const restore = failNextTokenCleanupCommit();

    let first;
    try {
      first = await sendAppointmentReminders(firestore, messaging, now, { logger });
    } finally {
      assert.equal(restore(), true);
    }

    assert.equal(first.sent, 1);
    assert.equal(first.failed, 0);
    const failureLog = entries.find(
      (entry) => entry.message === 'appointment reminder delivery failed',
    );
    assert.equal(failureLog?.level, 'error');
    assert.equal(failureLog?.fields.status, 'sent');
    assert.equal(failureLog?.fields.delivered, 1);
    assert.equal(failureLog?.fields.errorCode, 'grpc/14');
    const receipt = await readReceipt(firestore);
    assert.equal(receipt.status, 'sent');
    assert.equal(receipt.outcomeCode, 'delivered');

    const second = await sendAppointmentReminders(firestore, messaging, laterRun(15), { logger });
    assert.equal(second.retried, 0);
    assert.equal(messages.length, 1);
    // The rejected token stays enabled until a later reminder disables it.
    const dead = await firestore.doc(`users/${patientId}/deviceTokens/token-2`).get();
    assert.equal(dead.data()?.enabled, true);
    assert.equal(JSON.stringify(entries).includes(deadToken), false);
  });

  it('does not retry when a later locale batch fails after an earlier batch was delivered', async () => {
    const firestore = getFirestore(adminApp);
    const arabicToken = 'fcm-token-for-arabic-device-7654321';
    await firestore.doc(`users/${patientId}/deviceTokens/token-2`).set({
      createdAt: now,
      enabled: true,
      locale: 'ar',
      platform: 'ios',
      token: arabicToken,
      updatedAt: now,
    });
    const messages: { tokens: string[] }[] = [];
    const messaging = createMessagingStub(messages, (message, call) => {
      if (call === 2) {
        throw Object.assign(new Error('boom'), { code: 'messaging/internal-error' });
      }
      return deliverAll(message, call);
    });
    const { entries, logger } = createLogCapture();

    const first = await sendAppointmentReminders(firestore, messaging, now, { logger });
    const second = await sendAppointmentReminders(firestore, messaging, laterRun(15), { logger });

    assert.equal(first.sent, 1);
    assert.equal(first.failed, 0);
    assert.equal(second.retried, 0);
    const deliveries = (entry: string) =>
      messages.filter((message, index) => index !== 1 && message.tokens.includes(entry)).length;
    assert.equal(deliveries(token), 1);
    assert.equal(deliveries(arabicToken), 0);
    assert.equal(messages.length, 2);
    const failureLog = entries.find(
      (entry) => entry.message === 'appointment reminder delivery failed',
    );
    assert.equal(failureLog?.level, 'error');
    assert.deepEqual(failureLog?.fields, {
      attempt: 1,
      delivered: 1,
      errorCode: 'messaging/internal-error',
      maxAttempts: APPOINTMENT_REMINDER_MAX_ATTEMPTS,
      reminderId: deriveReminderId(appointmentId),
      retryable: true,
      status: 'sent',
      willRetry: false,
    });
    const receipt = await readReceipt(firestore);
    assert.equal(receipt.status, 'sent');
    assert.equal(receipt.outcomeCode, 'delivered');
  });

  it('abandons a reminder whose later batch outcome is unknown even with no confirmed delivery', async () => {
    const firestore = getFirestore(adminApp);
    const arabicToken = 'fcm-token-for-arabic-device-7654321';
    await firestore.doc(`users/${patientId}/deviceTokens/token-2`).set({
      createdAt: now,
      enabled: true,
      locale: 'ar',
      platform: 'ios',
      token: arabicToken,
      updatedAt: now,
    });
    const messages: { tokens: string[] }[] = [];
    const messaging = createMessagingStub(messages, (message, call) => {
      if (call === 2) {
        throw Object.assign(new Error('boom'), { code: 'messaging/internal-error' });
      }
      return message.tokens.map(() => ({
        error: { code: 'messaging/server-unavailable', message: 'busy' },
        success: false,
      }));
    });
    const { logger } = createLogCapture();

    const first = await sendAppointmentReminders(firestore, messaging, now, { logger });
    const second = await sendAppointmentReminders(firestore, messaging, laterRun(15), { logger });

    assert.equal(first.abandoned, 1);
    assert.equal(first.failed, 0);
    assert.equal(second.retried, 0);
    assert.equal(messages.length, 2);
    const receipt = await readReceipt(firestore);
    assert.equal(receipt.status, 'abandoned');
    assert.equal(receipt.outcomeCode, 'messaging/internal-error');
  });

  it('settles legacy failed receipts as abandoned and leaves legacy sending receipts alone', async () => {
    const firestore = getFirestore(adminApp);
    const legacyFailedId = 'appointment-legacy-failed';
    const legacySendingId = 'appointment-legacy-sending';
    const dueFifteenMinutesAgo = Timestamp.fromMillis(
      now.toMillis() + 24 * 60 * 60 * 1_000 - 15 * 60 * 1_000,
    );
    for (const id of [legacyFailedId, legacySendingId]) {
      await seedConfirmedAppointment(
        firestore,
        id,
        patientId,
        dueFifteenMinutesAgo,
        Timestamp.fromMillis(dueFifteenMinutesAgo.toMillis() + 30 * 60 * 1_000),
      );
    }
    await seedLegacyReceipt(firestore, legacyFailedId, 'failed', laterRun(-15));
    await seedLegacyReceipt(firestore, legacySendingId, 'sending', laterRun(-20));
    // A legacy `sending` receipt whose appointment is inside the window reaches the claim path.
    await seedLegacyReceipt(firestore, appointmentId, 'sending', laterRun(-20));
    const messages: unknown[] = [];
    const { entries, logger } = createLogCapture();

    const result = await sendAppointmentReminders(firestore, createMessagingStub(messages), now, {
      logger,
    });

    assert.deepEqual(result, {
      abandoned: 1,
      considered: 1,
      failed: 0,
      retried: 0,
      sent: 0,
      skipped: 1,
    } satisfies AppointmentReminderRunResult);
    assert.equal(messages.length, 0);
    const legacyFailed = await readReceipt(firestore, legacyFailedId);
    assert.equal(legacyFailed.status, 'abandoned');
    assert.equal(legacyFailed.outcomeCode, 'legacy-receipt');
    assert.equal(legacyFailed.attempts, undefined);
    assert.equal((await readReceipt(firestore, legacySendingId)).status, 'sending');
    assert.equal((await readReceipt(firestore)).status, 'sending');
    assert.deepEqual(
      entries.find((entry) => entry.message === 'appointment reminder legacy receipt abandoned')
        ?.fields,
      { reminderId: deriveReminderId(legacyFailedId) },
    );
  });
});
