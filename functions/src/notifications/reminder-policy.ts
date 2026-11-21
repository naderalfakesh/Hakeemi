import { createHash } from 'node:crypto';

import { Timestamp } from 'firebase-admin/firestore';

import { appointmentDocumentSchema } from '../appointments/contracts.js';

export const APPOINTMENT_REMINDER_LEAD_TIME_MS = 24 * 60 * 60 * 1_000;
export const APPOINTMENT_REMINDER_WINDOW_MS = 15 * 60 * 1_000;
// Each run also looks back this far past the 24-hour target, so an
// appointment a failed or missed run skipped is picked up by a later one.
// Receipts keep it from being reminded twice.
export const APPOINTMENT_REMINDER_CATCH_UP_MS = 60 * 60 * 1_000;
export const APPOINTMENT_REMINDER_RETRY_LOOKBACK_MS = 48 * 60 * 60 * 1_000;
export const APPOINTMENT_REMINDER_MAX_ATTEMPTS = 3;
export const REMINDER_CLAIM_LEASE_MS = 10 * 60 * 1_000;

export type AppointmentReminderWindow = {
  end: Timestamp;
  start: Timestamp;
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

export function isReminderStillDue(
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
