import { type Firestore, Timestamp } from 'firebase-admin/firestore';
import { type Messaging } from 'firebase-admin/messaging';
import * as functionsLogger from 'firebase-functions/logger';

import {
  deliverReminder,
  resolveDeliveryFailure,
  type DeliveryProgress,
  type ReminderLogger,
  type ReminderOutcome,
  type ReminderRunContext,
} from './reminder-delivery.js';
import {
  classifyDeliveryError,
  readErrorCode,
  ReminderDeliveryError,
} from './reminder-delivery-errors.js';
import {
  APPOINTMENT_REMINDER_MAX_ATTEMPTS,
  deriveReminderId,
  getAppointmentReminderWindow,
} from './reminder-policy.js';
import { claimReminder, type ReminderPass, updateReminderReceipt } from './reminder-receipts.js';
import { retryFailedReminders } from './reminder-retry-pass.js';

export type { ReminderLogger };

const SCHEDULED_QUERY_LIMIT = 500;

export type SendAppointmentRemindersOptions = {
  logger?: ReminderLogger;
};

export type AppointmentReminderRunResult = {
  abandoned: number;
  considered: number;
  failed: number;
  retried: number;
  sent: number;
  skipped: number;
};

export async function sendAppointmentReminders(
  firestore: Firestore,
  messaging: Messaging,
  now: Timestamp = Timestamp.now(),
  options: SendAppointmentRemindersOptions = {},
): Promise<AppointmentReminderRunResult> {
  const context: ReminderRunContext = {
    firestore,
    logger: options.logger ?? functionsLogger,
    messaging,
    now,
  };
  const result: AppointmentReminderRunResult = {
    abandoned: 0,
    considered: 0,
    failed: 0,
    retried: 0,
    sent: 0,
    skipped: 0,
  };

  // Run retries first so failures from this run wait until the next schedule tick.
  await retryFailedReminders(context, result, (appointmentSnapshot, pass) =>
    processReminderSafely(context, appointmentSnapshot, result, pass),
  );

  const window = getAppointmentReminderWindow(now);
  const appointments = await firestore
    .collection('appointments')
    .where('status', '==', 'confirmed')
    .where('startsAt', '>=', window.start)
    .where('startsAt', '<=', window.end)
    .limit(SCHEDULED_QUERY_LIMIT)
    .get();
  result.considered = appointments.size;

  for (const appointmentSnapshot of appointments.docs) {
    await processReminderSafely(context, appointmentSnapshot, result, 'scheduled');
  }

  context.logger.info('appointment reminder run complete', { ...result });

  return result;
}

async function processReminderSafely(
  context: ReminderRunContext,
  appointmentSnapshot: FirebaseFirestore.DocumentSnapshot,
  result: AppointmentReminderRunResult,
  pass: ReminderPass,
) {
  try {
    await processReminder(context, appointmentSnapshot, result, pass);
  } catch (error) {
    result.failed += 1;
    context.logger.error('appointment reminder processing failed', {
      errorCode: readErrorCode(error),
      reminderId: deriveReminderId(appointmentSnapshot.id),
    });
  }
}

async function processReminder(
  context: ReminderRunContext,
  appointmentSnapshot: FirebaseFirestore.DocumentSnapshot,
  result: AppointmentReminderRunResult,
  pass: ReminderPass,
) {
  const { firestore, logger, now } = context;
  const appointmentId = appointmentSnapshot.id;
  const reminderId = deriveReminderId(appointmentId);
  const claim = await claimReminder(firestore, appointmentSnapshot.ref, now, pass);

  if (!claim.claimed) {
    result.skipped += 1;
    return;
  }

  const progress: DeliveryProgress = { completed: 0, delivered: 0, issued: 0 };
  let outcome: ReminderOutcome;

  try {
    outcome = await deliverReminder(
      context,
      appointmentId,
      claim.appointmentData,
      claim.attempt,
      reminderId,
      progress,
    );
  } catch (error) {
    const failure =
      error instanceof ReminderDeliveryError
        ? { code: error.code, retryable: error.retryable }
        : classifyDeliveryError(error);

    outcome = resolveDeliveryFailure(failure, progress, claim.attempt);
    logger[outcome.status === 'failed' ? 'warn' : 'error']('appointment reminder delivery failed', {
      attempt: claim.attempt,
      delivered: progress.delivered,
      errorCode: failure.code,
      maxAttempts: APPOINTMENT_REMINDER_MAX_ATTEMPTS,
      reminderId,
      retryable: failure.retryable,
      status: outcome.status,
      willRetry: outcome.status === 'failed',
    });
  }

  result[outcome.status] += 1;

  try {
    await updateReminderReceipt(firestore, appointmentId, outcome.status, now, outcome.code);
  } catch (error) {
    // `sendIssuedAt` prevents future runs from re-claiming a possibly delivered reminder.
    logger.error('appointment reminder receipt update failed', {
      attempt: claim.attempt,
      delivered: progress.delivered,
      errorCode: readErrorCode(error),
      intendedStatus: outcome.status,
      reminderId,
      sendIssued: progress.issued > 0,
    });
  }
}
