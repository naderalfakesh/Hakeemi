import { type Firestore, type Timestamp } from 'firebase-admin/firestore';
import { type Messaging, type SendResponse } from 'firebase-admin/messaging';

import { appointmentDocumentSchema } from '../appointments/contracts.js';
import {
  type DeviceTokenEntry,
  disableInvalidTokens,
  groupTokensByLocale,
  readEnabledTokens,
} from './reminder-device-tokens.js';
import {
  type DeliveryFailure,
  NON_RETRYABLE_DELIVERY_CODES,
  readErrorCode,
  ReminderDeliveryError,
} from './reminder-delivery-errors.js';
import { buildAppointmentReminderMessage } from './reminder-message.js';
import { APPOINTMENT_REMINDER_MAX_ATTEMPTS } from './reminder-policy.js';

export type ReminderLogger = {
  error: (message: string, fields: Record<string, unknown>) => void;
  info: (message: string, fields: Record<string, unknown>) => void;
  warn: (message: string, fields: Record<string, unknown>) => void;
};

export type ReminderRunContext = {
  firestore: Firestore;
  logger: ReminderLogger;
  messaging: Messaging;
  now: Timestamp;
};

export type ReminderOutcome = {
  code: string;
  status: 'abandoned' | 'failed' | 'sent' | 'skipped';
};

export type DeliveryProgress = {
  completed: number;
  delivered: number;
  issued: number;
};

// Never retry once any device succeeded or a multicast send outcome is unknown.
export function resolveDeliveryFailure(
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

export async function deliverReminder(
  context: ReminderRunContext,
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
