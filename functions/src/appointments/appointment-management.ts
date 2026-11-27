import { createHash } from 'node:crypto';

import { Timestamp, type Transaction } from 'firebase-admin/firestore';
import { HttpsError } from 'firebase-functions/v2/https';
import { z } from 'zod';

import {
  cancelAppointmentResultSchema,
  rescheduleAppointmentResultSchema,
  type AppointmentDocument,
  type AvailabilitySlotDocument,
  type CancelAppointmentResult,
  type RescheduleAppointmentResult,
} from './contracts.js';

/** Keep appointment management aligned with the booking lead-time policy. */
export const APPOINTMENT_MANAGEMENT_LEAD_TIME_MS = 15 * 60 * 1_000;

const operationReceiptTimestampSchema = z.custom<Timestamp>((value) => value instanceof Timestamp);
const operationReceiptSchema = z
  .object({
    appointmentId: z.string().min(1),
    createdAt: operationReceiptTimestampSchema,
    operation: z.enum(['cancel', 'reschedule']),
    result: z.unknown(),
    slotId: z.string().nullable(),
    updatedAt: operationReceiptTimestampSchema,
  })
  .strict();

export function deriveOperationId(patientId: string, requestId: string) {
  return createHash('sha256').update(patientId).update('\0').update(requestId).digest('hex');
}

export function readOperationResult(
  input: unknown,
  expected: {
    appointmentId: string;
    operation: 'cancel';
    slotId: null;
  },
): CancelAppointmentResult;
export function readOperationResult(
  input: unknown,
  expected: {
    appointmentId: string;
    operation: 'reschedule';
    slotId: string;
  },
): RescheduleAppointmentResult;
export function readOperationResult(
  input: unknown,
  expected: {
    appointmentId: string;
    operation: 'cancel' | 'reschedule';
    slotId: string | null;
  },
): CancelAppointmentResult | RescheduleAppointmentResult {
  const parsedReceipt = operationReceiptSchema.safeParse(input);

  if (
    !parsedReceipt.success ||
    parsedReceipt.data.appointmentId !== expected.appointmentId ||
    parsedReceipt.data.operation !== expected.operation ||
    parsedReceipt.data.slotId !== expected.slotId
  ) {
    throw new HttpsError(
      'failed-precondition',
      'This request key has already been used for another appointment operation.',
    );
  }

  if (expected.operation === 'cancel') {
    const result = cancelAppointmentResultSchema.safeParse(parsedReceipt.data.result);

    if (!result.success) {
      throw new HttpsError('internal', 'The appointment operation receipt is invalid.');
    }

    return { ...result.data, isReplay: true };
  }

  const result = rescheduleAppointmentResultSchema.safeParse(parsedReceipt.data.result);

  if (!result.success) {
    throw new HttpsError('internal', 'The appointment operation receipt is invalid.');
  }

  return { ...result.data, isReplay: true };
}

export function assertAppointmentOwner(appointment: AppointmentDocument, patientId: string) {
  if (appointment.patientId !== patientId) {
    throw new HttpsError('permission-denied', 'You can only manage your own appointments.');
  }
}

export function assertBookedSlot(slot: AvailabilitySlotDocument, appointmentId: string) {
  if (slot.status !== 'booked' || slot.appointmentId !== appointmentId) {
    throw new HttpsError('internal', 'The appointment and availability slot are inconsistent.');
  }
}

export function validateAppointmentManagementLeadTime(
  appointment: AppointmentDocument,
  now: Timestamp,
  operation: 'cancel' | 'reschedule',
) {
  const timeUntilStart = appointment.startsAt.toMillis() - now.toMillis();

  if (timeUntilStart < APPOINTMENT_MANAGEMENT_LEAD_TIME_MS) {
    throw new HttpsError(
      'failed-precondition',
      `Appointments cannot be ${operation === 'cancel' ? 'cancelled' : 'rescheduled'} this close to their start.`,
    );
  }
}

export function toAppointmentSummary(appointmentId: string, appointment: AppointmentDocument) {
  return {
    cancelledAt: appointment.cancelledAt?.toDate().toISOString() ?? null,
    cancelledBy: appointment.cancelledBy,
    clinicId: appointment.clinicId,
    endsAt: appointment.endsAt.toDate().toISOString(),
    id: appointmentId,
    providerId: appointment.providerId,
    reasonCategory: appointment.reasonCategory,
    slotId: appointment.slotId,
    startsAt: appointment.startsAt.toDate().toISOString(),
    status: appointment.status,
    timezone: appointment.timezone,
    visitMode: appointment.visitMode,
  };
}

// Keep this import-level reference explicit so transaction mocks used by unit tests can satisfy
// the same shape without needing a Firestore implementation detail.
export type AppointmentTransaction = Transaction;
