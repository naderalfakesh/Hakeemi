import { createHash } from 'node:crypto';

import { FieldValue, type Firestore, Timestamp } from 'firebase-admin/firestore';
import { type Messaging, type MulticastMessage, type SendResponse } from 'firebase-admin/messaging';
import * as functionsLogger from 'firebase-functions/logger';
import { z, ZodError } from 'zod';

import { appointmentDocumentSchema } from '../appointments/contracts.js';

export const APPOINTMENT_REMINDER_LEAD_TIME_MS = 24 * 60 * 60 * 1_000;
export const APPOINTMENT_REMINDER_WINDOW_MS = 15 * 60 * 1_000;
// Each run also looks back this far past the 24-hour target, so an
// appointment a failed or missed run skipped is picked up by a later one.
// Receipts keep it from being reminded twice.
export const APPOINTMENT_REMINDER_CATCH_UP_MS = 60 * 60 * 1_000;
export const APPOINTMENT_REMINDER_RETRY_LOOKBACK_MS = 48 * 60 * 60 * 1_000;
export const APPOINTMENT_REMINDER_MAX_ATTEMPTS = 3;
const REMINDER_CLAIM_LEASE_MS = 10 * 60 * 1_000;
const RETRY_QUERY_LIMIT = 500;

// Errors that no later attempt can fix: malformed requests, credential,
// permission and sender configuration problems, and tokens FCM has rejected.
const NON_RETRYABLE_DELIVERY_CODES = new Set([
  'app/invalid-argument',
  'app/invalid-credential',
  'grpc/7',
  'grpc/16',
  'messaging/authentication-error',
  'messaging/invalid-apns-credentials',
  'messaging/invalid-argument',
  'messaging/invalid-data-payload-key',
  'messaging/invalid-options',
  'messaging/invalid-package-name',
  'messaging/invalid-payload',
  'messaging/invalid-recipient',
  'messaging/invalid-registration-token',
  'messaging/mismatched-credential',
  'messaging/payload-size-limit-exceeded',
  'messaging/registration-token-not-registered',
  'messaging/sender-id-mismatch',
  'messaging/third-party-auth-error',
  'permission-denied',
  'unauthenticated',
]);

const deviceTokenSchema = z
  .object({
    enabled: z.literal(true),
    locale: z.string().optional(),
    platform: z.enum(['android', 'ios']),
    token: z.string().trim().min(16).max(4096),
  })
  .passthrough();

const reminderReceiptSchema = z
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

export type ReminderLocale = 'ar' | 'en';

export type ReminderReceiptStatus = z.infer<typeof reminderReceiptSchema>['status'];

export type ReminderLogger = {
  error: (message: string, fields: Record<string, unknown>) => void;
  info: (message: string, fields: Record<string, unknown>) => void;
  warn: (message: string, fields: Record<string, unknown>) => void;
};

export type SendAppointmentRemindersOptions = {
  logger?: ReminderLogger;
};

export type AppointmentReminderWindow = {
  end: Timestamp;
  start: Timestamp;
};

export type AppointmentReminderRunResult = {
  abandoned: number;
  considered: number;
  failed: number;
  retried: number;
  sent: number;
  skipped: number;
};

export type DeliveryFailure = {
  code: string;
  retryable: boolean;
};

const REMINDER_COPY: Record<ReminderLocale, { body: string; title: string }> = {
  ar: {
    body: 'لديك موعد قادم في «حكيمي».',
    title: 'تذكير بالموعد',
  },
  en: {
    body: 'You have a Hakeemi appointment coming up.',
    title: 'Appointment reminder',
  },
};

export function getAppointmentReminderWindow(now: Timestamp): AppointmentReminderWindow {
  const target = now.toMillis() + APPOINTMENT_REMINDER_LEAD_TIME_MS;
  const halfWindow = APPOINTMENT_REMINDER_WINDOW_MS / 2;

  return {
    end: Timestamp.fromMillis(target + halfWindow),
    start: Timestamp.fromMillis(target - halfWindow - APPOINTMENT_REMINDER_CATCH_UP_MS),
  };
}

export function deriveReminderId(appointmentId: string) {
  return createHash('sha256').update(appointmentId).update('\0').update('24h').digest('hex');
}

export function resolveReminderLocale(locale: unknown): ReminderLocale {
  return typeof locale === 'string' && /^ar(?![a-z])/i.test(locale.trim()) ? 'ar' : 'en';
}

export function buildAppointmentReminderMessage(
  tokens: readonly string[],
  appointmentId: string,
  locale: ReminderLocale = 'en',
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
    notification: { ...REMINDER_COPY[locale] },
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

export function classifyDeliveryError(error: unknown): DeliveryFailure {
  if (error instanceof ZodError) {
    return { code: 'invalid-document', retryable: false };
  }

  const code = readErrorCode(error);

  return { code, retryable: !NON_RETRYABLE_DELIVERY_CODES.has(code) };
}

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

type DeviceTokenEntry = {
  locale: ReminderLocale;
  reference: FirebaseFirestore.DocumentReference;
  token: string;
};

// Only the retry pass picks up `failed` receipts, so a reminder that fails is
// retried on the next schedule tick rather than again in the same run.
type ReminderPass = 'retry' | 'scheduled';

type ClaimResult =
  | { appointmentData: FirebaseFirestore.DocumentData | undefined; attempt: number; claimed: true }
  | { claimed: false };

type ReminderOutcome = {
  code: string;
  status: 'abandoned' | 'failed' | 'sent' | 'skipped';
};

type DeliveryProgress = {
  completed: number;
  delivered: number;
  issued: number;
};

class ReminderDeliveryError extends Error {
  constructor(
    readonly code: string,
    readonly retryable: boolean,
  ) {
    super(`Appointment reminder delivery failed: ${code}`);
    this.name = 'ReminderDeliveryError';
  }
}

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

function isReminderStillDue(
  appointmentData: FirebaseFirestore.DocumentData | undefined,
  now: Timestamp,
): { ok: true } | { ok: false; reason: string } {
  const appointment = appointmentDocumentSchema.safeParse(appointmentData);

  if (!appointment.success) {
    return { ok: false, reason: 'invalid-document' };
  }

  if (appointment.data.status !== 'confirmed') {
    return { ok: false, reason: 'appointment-not-confirmed' };
  }

  const startsAt = appointment.data.startsAt.toMillis();

  if (startsAt <= now.toMillis()) {
    return { ok: false, reason: 'appointment-started' };
  }

  const dueAt = startsAt - APPOINTMENT_REMINDER_LEAD_TIME_MS;

  if (now.toMillis() - dueAt > APPOINTMENT_REMINDER_RETRY_LOOKBACK_MS) {
    return { ok: false, reason: 'lookback-expired' };
  }

  return { ok: true };
}

function groupTokensByLocale(tokens: readonly DeviceTokenEntry[]) {
  const groups = new Map<ReminderLocale, DeviceTokenEntry[]>();

  for (const entry of tokens) {
    const group = groups.get(entry.locale);

    if (group) {
      group.push(entry);
    } else {
      groups.set(entry.locale, [entry]);
    }
  }

  return groups;
}

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

    return parsed.success
      ? [
          {
            locale: resolveReminderLocale(parsed.data.locale),
            reference: document.ref,
            token: parsed.data.token,
          },
        ]
      : [];
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

  return invalidCount;
}

async function claimReminder(
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
async function settleFailedReceipt(
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

async function updateReminderReceipt(
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

// Only short enumerated identifiers are kept; error messages are never
// logged or stored because provider messages can echo request contents.
function readErrorCode(error: unknown): string {
  if (typeof error === 'object' && error !== null && 'code' in error) {
    const code = (error as { code: unknown }).code;

    if (typeof code === 'string' && /^[a-z0-9/_.-]{1,64}$/i.test(code)) {
      return code;
    }

    if (typeof code === 'number' && Number.isInteger(code)) {
      return `grpc/${code}`;
    }
  }

  return 'unknown';
}
