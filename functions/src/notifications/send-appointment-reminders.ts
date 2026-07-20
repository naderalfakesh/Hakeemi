import { createHash } from 'node:crypto';

import { FieldValue, type Firestore, Timestamp } from 'firebase-admin/firestore';
import { type Messaging, type MulticastMessage, type SendResponse } from 'firebase-admin/messaging';
import { z } from 'zod';

import { appointmentDocumentSchema } from '../appointments/contracts.js';

export const APPOINTMENT_REMINDER_LEAD_TIME_MS = 24 * 60 * 60 * 1_000;
export const APPOINTMENT_REMINDER_WINDOW_MS = 15 * 60 * 1_000;
const REMINDER_CLAIM_LEASE_MS = 10 * 60 * 1_000;

const deviceTokenSchema = z
  .object({
    enabled: z.literal(true),
    locale: z.enum(['ar', 'en']),
    platform: z.enum(['android', 'ios']),
    token: z.string().trim().min(16).max(4096),
  })
  .passthrough();

const reminderReceiptSchema = z
  .object({
    appointmentId: z.string().min(1),
    claimedAt: z.custom<Timestamp>((value) => value instanceof Timestamp),
    createdAt: z.custom<Timestamp>((value) => value instanceof Timestamp),
    status: z.enum(['failed', 'sending', 'sent', 'skipped']),
    updatedAt: z.custom<Timestamp>((value) => value instanceof Timestamp),
  })
  .passthrough();

export type AppointmentReminderWindow = {
  end: Timestamp;
  start: Timestamp;
};

export type AppointmentReminderRunResult = {
  failed: number;
  sent: number;
  skipped: number;
  considered: number;
};

export function getAppointmentReminderWindow(now: Timestamp): AppointmentReminderWindow {
  const target = now.toMillis() + APPOINTMENT_REMINDER_LEAD_TIME_MS;
  const halfWindow = APPOINTMENT_REMINDER_WINDOW_MS / 2;

  return {
    end: Timestamp.fromMillis(target + halfWindow),
    start: Timestamp.fromMillis(target - halfWindow),
  };
}

export function deriveReminderId(appointmentId: string) {
  return createHash('sha256').update(appointmentId).update('\0').update('24h').digest('hex');
}

export function buildAppointmentReminderMessage(
  tokens: readonly string[],
  appointmentId: string,
): MulticastMessage {
  return {
    android: {
      notification: {
        channelId: 'appointment-reminders',
      },
    },
    apns: {
      payload: {
        aps: {
          sound: 'default',
        },
      },
    },
    data: {
      appointmentId,
      type: 'appointment_reminder',
    },
    notification: {
      body: 'You have a Hakeemi appointment coming up.',
      title: 'Appointment reminder',
    },
    tokens: [...tokens],
  };
}

export function shouldDisableDeviceToken(response: SendResponse) {
  const code = response.error?.code;

  return (
    code === 'messaging/registration-token-not-registered' ||
    code === 'messaging/invalid-registration-token'
  );
}

export async function sendAppointmentReminders(
  firestore: Firestore,
  messaging: Messaging,
  now: Timestamp = Timestamp.now(),
): Promise<AppointmentReminderRunResult> {
  const window = getAppointmentReminderWindow(now);
  const appointments = await firestore
    .collection('appointments')
    .where('status', '==', 'confirmed')
    .where('startsAt', '>=', window.start)
    .where('startsAt', '<=', window.end)
    .limit(500)
    .get();
  const result: AppointmentReminderRunResult = {
    considered: appointments.size,
    failed: 0,
    sent: 0,
    skipped: 0,
  };

  for (const appointmentSnapshot of appointments.docs) {
    const claimed = await claimReminder(firestore, appointmentSnapshot.id, now);

    if (!claimed) {
      result.skipped += 1;
      continue;
    }

    try {
      const appointment = appointmentDocumentSchema.parse(appointmentSnapshot.data());
      const tokens = await readEnabledTokens(firestore, appointment.patientId);

      if (tokens.length === 0) {
        await updateReminderReceipt(firestore, appointmentSnapshot.id, 'skipped', now);
        result.skipped += 1;
        continue;
      }

      const response = await messaging.sendEachForMulticast(
        buildAppointmentReminderMessage(
          tokens.map((entry) => entry.token),
          appointmentSnapshot.id,
        ),
      );
      await disableInvalidTokens(firestore, tokens, response.responses);
      await updateReminderReceipt(firestore, appointmentSnapshot.id, 'sent', now);
      result.sent += 1;
    } catch {
      await updateReminderReceipt(firestore, appointmentSnapshot.id, 'failed', now);
      result.failed += 1;
    }
  }

  return result;
}

type DeviceTokenEntry = {
  reference: FirebaseFirestore.DocumentReference;
  token: string;
};

async function readEnabledTokens(firestore: Firestore, patientId: string) {
  const snapshot = await firestore
    .collection('users')
    .doc(patientId)
    .collection('deviceTokens')
    .where('enabled', '==', true)
    .limit(500)
    .get();

  return snapshot.docs.flatMap<DeviceTokenEntry>((document) => {
    const parsed = deviceTokenSchema.safeParse(document.data());

    return parsed.success ? [{ reference: document.ref, token: parsed.data.token }] : [];
  });
}

async function disableInvalidTokens(
  firestore: Firestore,
  tokens: readonly DeviceTokenEntry[],
  responses: readonly SendResponse[],
) {
  const batch = firestore.batch();
  let invalidCount = 0;

  responses.forEach((response, index) => {
    const entry = tokens[index];

    if (entry && shouldDisableDeviceToken(response)) {
      batch.update(entry.reference, {
        enabled: false,
        updatedAt: FieldValue.serverTimestamp(),
      });
      invalidCount += 1;
    }
  });

  if (invalidCount > 0) {
    await batch.commit();
  }
}

async function claimReminder(firestore: Firestore, appointmentId: string, now: Timestamp) {
  const receiptReference = firestore.doc(`appointmentReminders/${deriveReminderId(appointmentId)}`);

  return firestore.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(receiptReference);
    const existing = snapshot.exists ? reminderReceiptSchema.safeParse(snapshot.data()) : null;

    if (existing?.success) {
      if (existing.data.status === 'sent' || existing.data.status === 'skipped') {
        return false;
      }

      if (
        existing.data.status === 'sending' &&
        now.toMillis() - existing.data.claimedAt.toMillis() < REMINDER_CLAIM_LEASE_MS
      ) {
        return false;
      }
    }

    const fields = {
      appointmentId,
      claimedAt: now,
      status: 'sending' as const,
      updatedAt: FieldValue.serverTimestamp(),
    };

    if (snapshot.exists) {
      transaction.update(receiptReference, fields);
    } else {
      transaction.create(receiptReference, {
        ...fields,
        createdAt: FieldValue.serverTimestamp(),
      });
    }

    return true;
  });
}

async function updateReminderReceipt(
  firestore: Firestore,
  appointmentId: string,
  status: 'failed' | 'sent' | 'skipped',
  now: Timestamp,
) {
  await firestore.doc(`appointmentReminders/${deriveReminderId(appointmentId)}`).update({
    status,
    updatedAt: now,
  });
}
