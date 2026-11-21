import { FieldValue, type Firestore, Timestamp } from 'firebase-admin/firestore';
import { z } from 'zod';

import { appointmentDocumentSchema } from '../appointments/contracts.js';
import {
  APPOINTMENT_REMINDER_MAX_ATTEMPTS,
  deriveReminderId,
  REMINDER_CLAIM_LEASE_MS,
} from './reminder-policy.js';

export const reminderReceiptSchema = z
  .object({
    appointmentId: z.string().min(1),
    attempts: z.number().int().min(0).optional(),
    claimedAt: z.custom<Timestamp>((value) => value instanceof Timestamp),
    createdAt: z.custom<Timestamp>((value) => value instanceof Timestamp),
    sendIssuedAt: z.custom<Timestamp>((value) => value instanceof Timestamp).optional(),
    status: z.enum(['abandoned', 'failed', 'sending', 'sent', 'skipped']),
    updatedAt: z.custom<Timestamp>((value) => value instanceof Timestamp),
  })
  .passthrough();

export type ReminderReceiptStatus = z.infer<typeof reminderReceiptSchema>['status'];

// Only the retry pass picks up `failed` receipts, so a reminder that fails is
// retried on the next schedule tick rather than again in the same run.
export type ReminderPass = 'retry' | 'scheduled';

export type ClaimResult =
  | { appointmentData: FirebaseFirestore.DocumentData | undefined; attempt: number; claimed: true }
  | { claimed: false };

export async function claimReminder(
  firestore: Firestore,
  appointmentReference: FirebaseFirestore.DocumentReference,
  now: Timestamp,
  pass: ReminderPass,
): Promise<ClaimResult> {
  const appointmentId = appointmentReference.id;
  const receiptReference = firestore.doc(`appointmentReminders/${deriveReminderId(appointmentId)}`);

  return firestore.runTransaction(async (transaction) => {
    // The appointment is re-read here so a cancellation or reschedule that
    // landed after the run's query is respected before anything is sent.
    const [snapshot, appointmentSnapshot] = await Promise.all([
      transaction.get(receiptReference),
      transaction.get(appointmentReference),
    ]);
    const appointmentData = appointmentSnapshot.data();
    const current = appointmentDocumentSchema.safeParse(appointmentData);

    if (
      current.success &&
      (current.data.status !== 'confirmed' || current.data.startsAt.toMillis() <= now.toMillis())
    ) {
      return { claimed: false };
    }

    const existing = snapshot.exists ? reminderReceiptSchema.safeParse(snapshot.data()) : null;
    let attempts = 0;

    if (existing?.success) {
      const { status } = existing.data;

      if (status === 'abandoned' || status === 'sent' || status === 'skipped') {
        return { claimed: false };
      }

      if (status === 'failed' && pass === 'scheduled' && existing.data.attempts !== undefined) {
        return { claimed: false };
      }

      // Receipts written before `attempts` existed may already have been
      // delivered (the old code recorded `failed` for post-send errors too).
      if (existing.data.attempts === undefined) {
        if (status === 'failed') {
          transaction.update(receiptReference, {
            outcomeCode: 'legacy-receipt',
            status: 'abandoned',
            updatedAt: now,
          });
        }
        return { claimed: false };
      }

      attempts = existing.data.attempts;

      if (
        status === 'sending' &&
        (existing.data.sendIssuedAt !== undefined ||
          now.toMillis() - existing.data.claimedAt.toMillis() < REMINDER_CLAIM_LEASE_MS)
      ) {
        return { claimed: false };
      }

      if (attempts >= APPOINTMENT_REMINDER_MAX_ATTEMPTS) {
        transaction.update(receiptReference, {
          outcomeCode: 'attempts-exhausted',
          status: 'abandoned',
          updatedAt: now,
        });
        return { claimed: false };
      }
    }

    const attempt = attempts + 1;
    const fields = {
      appointmentId,
      attempts: attempt,
      claimedAt: now,
      status: 'sending' as const,
      updatedAt: FieldValue.serverTimestamp(),
    };

    if (snapshot.exists) {
      transaction.update(receiptReference, { ...fields, sendIssuedAt: FieldValue.delete() });
    } else {
      transaction.create(receiptReference, {
        ...fields,
        createdAt: FieldValue.serverTimestamp(),
      });
    }

    return { appointmentData, attempt, claimed: true };
  });
}

// Moves a `failed` receipt to a terminal state only if no concurrent run has
// claimed it in the meantime.
export async function settleFailedReceipt(
  firestore: Firestore,
  receiptReference: FirebaseFirestore.DocumentReference,
  status: 'abandoned' | 'skipped',
  outcomeCode: string,
  now: Timestamp,
) {
  return firestore.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(receiptReference);

    if (!snapshot.exists || snapshot.get('status') !== 'failed') {
      return false;
    }

    transaction.update(receiptReference, { outcomeCode, status, updatedAt: now });
    return true;
  });
}

export async function updateReminderReceipt(
  firestore: Firestore,
  appointmentId: string,
  status: 'abandoned' | 'failed' | 'sent' | 'skipped',
  now: Timestamp,
  outcomeCode: string,
) {
  await firestore.doc(`appointmentReminders/${deriveReminderId(appointmentId)}`).update({
    outcomeCode,
    status,
    updatedAt: now,
  });
}
