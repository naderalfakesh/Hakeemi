import { type Firestore, Timestamp } from 'firebase-admin/firestore';
import { type Messaging, type SendResponse } from 'firebase-admin/messaging';
import * as functionsLogger from 'firebase-functions/logger';

import { appointmentDocumentSchema } from '../appointments/contracts.js';
import {
  type DeviceTokenEntry,
  disableInvalidTokens,
  groupTokensByLocale,
  readEnabledTokens,
} from './reminder-device-tokens.js';
import {
  classifyDeliveryError,
  type DeliveryFailure,
  NON_RETRYABLE_DELIVERY_CODES,
  readErrorCode,
  ReminderDeliveryError,
} from './reminder-delivery-errors.js';
import { buildAppointmentReminderMessage } from './reminder-message.js';
import {
  APPOINTMENT_REMINDER_MAX_ATTEMPTS,
  deriveReminderId,
  getAppointmentReminderWindow,
  isReminderStillDue,
} from './reminder-policy.js';
import {
  claimReminder,
  type ReminderPass,
  reminderReceiptSchema,
  settleFailedReceipt,
  updateReminderReceipt,
} from './reminder-receipts.js';

const RETRY_QUERY_LIMIT = 500;

export type ReminderLogger = {
  error: (message: string, fields: Record<string, unknown>) => void;
  info: (message: string, fields: Record<string, unknown>) => void;
  warn: (message: string, fields: Record<string, unknown>) => void;
};

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
  const context: RunContext = {
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

  // Retries run first so a reminder that fails in this run waits for the next
  // schedule tick instead of being retried immediately.
  await retryFailedReminders(context, result);

  const window = getAppointmentReminderWindow(now);
  const appointments = await firestore
    .collection('appointments')
    .where('status', '==', 'confirmed')
    .where('startsAt', '>=', window.start)
    .where('startsAt', '<=', window.end)
    .limit(500)
    .get();
  result.considered = appointments.size;

  for (const appointmentSnapshot of appointments.docs) {
    await processReminderSafely(context, appointmentSnapshot, result, 'scheduled');
  }

  context.logger.info('appointment reminder run complete', { ...result });

  return result;
}

type RunContext = {
  firestore: Firestore;
  logger: ReminderLogger;
  messaging: Messaging;
  now: Timestamp;
};

type ReminderOutcome = {
  code: string;
  status: 'abandoned' | 'failed' | 'sent' | 'skipped';
};

type DeliveryProgress = {
  completed: number;
  delivered: number;
  issued: number;
};

// One appointment's unexpected error (for example a claim transaction that
// keeps aborting) must not stop the rest of the run. Nothing is recorded, so
// the catch-up window or the retry pass picks it up on a later run.
async function processReminderSafely(
  context: RunContext,
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
  context: RunContext,
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
    // The receipt stays `sending`; once `sendIssuedAt` is set no later run
    // claims it, so a reminder FCM may have accepted is never sent again.
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

// Once any device may have received the reminder, a retry could duplicate it.
// Only failures with no successful recipient and a known-undelivered send are
// retried: errors before the first multicast, a rejection of the first
// multicast (the SDK rejects before transmitting), and per-token failures.
function resolveDeliveryFailure(
  failure: DeliveryFailure,
  progress: DeliveryProgress,
  attempt: number,
): ReminderOutcome {
  if (progress.delivered > 0) {
    return { code: 'delivered', status: 'sent' };
  }

  const outcomeUnknown = progress.completed > 0 && progress.issued > progress.completed;
  const willRetry =
    !outcomeUnknown && failure.retryable && attempt < APPOINTMENT_REMINDER_MAX_ATTEMPTS;

  return { code: failure.code, status: willRetry ? 'failed' : 'abandoned' };
}

async function deliverReminder(
  context: RunContext,
  appointmentId: string,
  appointmentData: FirebaseFirestore.DocumentData | undefined,
  attempt: number,
  reminderId: string,
  progress: DeliveryProgress,
): Promise<{ code: string; status: 'sent' | 'skipped' }> {
  const { firestore, logger, messaging, now } = context;
  const appointment = appointmentDocumentSchema.parse(appointmentData);
  const tokens = await readEnabledTokens(firestore, appointment.patientId);

  if (tokens.length === 0) {
    return { code: 'no-enabled-tokens', status: 'skipped' };
  }

  const sent: DeviceTokenEntry[] = [];
  const responses: SendResponse[] = [];

  await firestore.doc(`appointmentReminders/${reminderId}`).update({ sendIssuedAt: now });

  for (const [locale, entries] of groupTokensByLocale(tokens)) {
    progress.issued += 1;
    const response = await messaging.sendEachForMulticast(
      buildAppointmentReminderMessage(
        entries.map((entry) => entry.token),
        appointmentId,
        locale,
      ),
    );
    progress.completed += 1;
    progress.delivered += response.responses.filter((entry) => entry.success).length;

    sent.push(...entries);
    responses.push(...response.responses);
  }

  const disabledTokens = await disableInvalidTokens(firestore, sent, responses);
  const failures = responses.filter((response) => !response.success);
  const delivered = responses.length - failures.length;
  const errorCodes = [...new Set(failures.map((response) => readErrorCode(response.error)))];

  if (delivered > 0) {
    if (failures.length > 0) {
      logger.warn('appointment reminder partially delivered', {
        attempt,
        delivered,
        disabledTokens,
        errorCodes,
        failed: failures.length,
        reminderId,
      });
    }

    return { code: 'delivered', status: 'sent' };
  }

  if (responses.length > 0 && disabledTokens === responses.length) {
    logger.warn('appointment reminder skipped: every device token was rejected', {
      attempt,
      disabledTokens,
      reminderId,
    });

    return { code: 'no-valid-tokens', status: 'skipped' };
  }

  const retryableCode = errorCodes.find((code) => !NON_RETRYABLE_DELIVERY_CODES.has(code));

  throw new ReminderDeliveryError(
    retryableCode ?? errorCodes[0] ?? 'unknown',
    retryableCode !== undefined,
  );
}

async function retryFailedReminders(context: RunContext, result: AppointmentReminderRunResult) {
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
        result.abandoned += 1;
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
        result.abandoned += 1;
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
        result.skipped += 1;
        logger.info('appointment reminder retry skipped', {
          reason: due.reason,
          reminderId: receiptSnapshot.id,
        });
      }
      continue;
    }

    result.retried += 1;
    await processReminderSafely(context, appointmentSnapshot, result, 'retry');
  }
}
