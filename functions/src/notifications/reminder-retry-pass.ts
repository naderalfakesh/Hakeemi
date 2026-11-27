import { isReminderStillDue } from './reminder-policy.js';
import {
  type ReminderPass,
  reminderReceiptSchema,
  settleFailedReceipt,
} from './reminder-receipts.js';
import type { ReminderRunContext } from './reminder-delivery.js';

const RETRY_QUERY_LIMIT = 500;

export type ReminderRetryCounters = {
  abandoned: number;
  retried: number;
  skipped: number;
};

export async function retryFailedReminders(
  context: ReminderRunContext,
  counters: ReminderRetryCounters,
  processAppointment: (
    appointmentSnapshot: FirebaseFirestore.DocumentSnapshot,
    pass: ReminderPass,
  ) => Promise<void>,
) {
  const { firestore, logger, now } = context;
  const receipts = await firestore
    .collection('appointmentReminders')
    .where('status', '==', 'failed')
    .limit(RETRY_QUERY_LIMIT)
    .get();

  for (const receiptSnapshot of receipts.docs) {
    const receipt = reminderReceiptSchema.safeParse(receiptSnapshot.data());

    if (!receipt.success) {
      if (
        await settleFailedReceipt(
          firestore,
          receiptSnapshot.ref,
          'abandoned',
          'invalid-receipt',
          now,
        )
      ) {
        counters.abandoned += 1;
        logger.error('appointment reminder receipt is invalid', { reminderId: receiptSnapshot.id });
      }
      continue;
    }

    if (receipt.data.attempts === undefined) {
      if (
        await settleFailedReceipt(
          firestore,
          receiptSnapshot.ref,
          'abandoned',
          'legacy-receipt',
          now,
        )
      ) {
        counters.abandoned += 1;
        logger.warn('appointment reminder legacy receipt abandoned', {
          reminderId: receiptSnapshot.id,
        });
      }
      continue;
    }

    const appointmentSnapshot = await firestore
      .doc(`appointments/${receipt.data.appointmentId}`)
      .get();
    const due = isReminderStillDue(appointmentSnapshot.data(), now);

    if (!due.ok) {
      if (await settleFailedReceipt(firestore, receiptSnapshot.ref, 'skipped', due.reason, now)) {
        counters.skipped += 1;
        logger.info('appointment reminder retry skipped', {
          reason: due.reason,
          reminderId: receiptSnapshot.id,
        });
      }
      continue;
    }

    counters.retried += 1;
    await processAppointment(appointmentSnapshot, 'retry');
  }
}
