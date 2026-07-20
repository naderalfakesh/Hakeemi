import { createHash } from 'node:crypto';

import { FieldValue, type Firestore, Timestamp, type Transaction } from 'firebase-admin/firestore';
import { HttpsError } from 'firebase-functions/v2/https';
import { z } from 'zod';

import {
  appointmentDocumentSchema,
  availabilitySlotDocumentSchema,
  cancelAppointmentRequestSchema,
  cancelAppointmentResultSchema,
  rescheduleAppointmentRequestSchema,
  rescheduleAppointmentResultSchema,
  type AppointmentDocument,
  type CancelAppointmentRequest,
  type CancelAppointmentResult,
  type RescheduleAppointmentRequest,
  type RescheduleAppointmentResult,
} from './contracts.js';
import {
  parseStoredAppointment,
  parseStoredSlot,
  validateAvailableSlot,
  validateSlotOwnership,
} from './book-appointment.js';

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

export function parseCancelAppointmentRequest(input: unknown): CancelAppointmentRequest {
  const parsedRequest = cancelAppointmentRequestSchema.safeParse(input);

  if (!parsedRequest.success) {
    throw new HttpsError('invalid-argument', 'Choose a valid appointment and try again.');
  }

  return parsedRequest.data;
}

export function parseRescheduleAppointmentRequest(input: unknown): RescheduleAppointmentRequest {
  const parsedRequest = rescheduleAppointmentRequestSchema.safeParse(input);

  if (!parsedRequest.success) {
    throw new HttpsError('invalid-argument', 'Choose a valid appointment slot and try again.');
  }

  return parsedRequest.data;
}

export async function cancelAppointment(
  firestore: Firestore,
  patientId: string,
  request: CancelAppointmentRequest,
  now: Timestamp = Timestamp.now(),
): Promise<CancelAppointmentResult> {
  const appointmentReference = firestore.doc(`appointments/${request.appointmentId}`);
  const operationReference = firestore.doc(
    `appointmentOperations/${deriveOperationId(patientId, request.requestId)}`,
  );

  return firestore.runTransaction(async (transaction) => {
    const [operationSnapshot, appointmentSnapshot] = await Promise.all([
      transaction.get(operationReference),
      transaction.get(appointmentReference),
    ]);

    if (operationSnapshot.exists) {
      return readOperationResult(operationSnapshot.data(), {
        appointmentId: request.appointmentId,
        operation: 'cancel',
        slotId: null,
      });
    }

    if (!appointmentSnapshot.exists) {
      throw new HttpsError('not-found', 'This appointment does not exist.');
    }

    const appointment = parseStoredAppointment(appointmentSnapshot.data());
    assertAppointmentOwner(appointment, patientId);

    const appointmentSlotReference = firestore.doc(`availabilitySlots/${appointment.slotId}`);
    const slotSnapshot = await transaction.get(appointmentSlotReference);

    if (!slotSnapshot.exists) {
      throw new HttpsError('internal', 'The appointment has no matching availability slot.');
    }

    const slot = parseStoredSlot(slotSnapshot.data());

    // A retry after a committed cancellation is safe and returns the durable state.
    if (appointment.status === 'cancelled') {
      if (appointment.cancelledBy !== 'patient') {
        throw new HttpsError('failed-precondition', 'This appointment cannot be cancelled again.');
      }

      throwIfCancelledSlotIsNotReleased(slot);
      return cancelAppointmentResultSchema.parse({
        appointment: toAppointmentSummary(request.appointmentId, appointment),
        isReplay: true,
      });
    }

    assertBookedSlot(slot, request.appointmentId);

    if (appointment.status !== 'confirmed') {
      throw new HttpsError('failed-precondition', 'Only confirmed appointments can be cancelled.');
    }

    validateAppointmentManagementLeadTime(appointment, now, 'cancel');

    const cancelledAppointment = appointmentDocumentSchema.parse({
      ...appointment,
      cancelledAt: now,
      cancelledBy: 'patient',
      status: 'cancelled',
      updatedAt: now,
    });
    const availableSlot = availabilitySlotDocumentSchema.parse({
      ...slot,
      appointmentId: null,
      status: 'available',
      updatedAt: now,
      version: slot.version + 1,
    });

    transaction.update(appointmentReference, {
      cancelledAt: FieldValue.serverTimestamp(),
      cancelledBy: cancelledAppointment.cancelledBy,
      status: cancelledAppointment.status,
      updatedAt: FieldValue.serverTimestamp(),
    });
    transaction.update(appointmentSlotReference, {
      appointmentId: availableSlot.appointmentId,
      status: availableSlot.status,
      updatedAt: FieldValue.serverTimestamp(),
      version: availableSlot.version,
    });

    transaction.create(operationReference, {
      appointmentId: request.appointmentId,
      createdAt: FieldValue.serverTimestamp(),
      operation: 'cancel',
      result: {
        appointment: toAppointmentSummary(request.appointmentId, cancelledAppointment),
        isReplay: false,
      },
      slotId: null,
      updatedAt: FieldValue.serverTimestamp(),
    });

    return cancelAppointmentResultSchema.parse({
      appointment: toAppointmentSummary(request.appointmentId, cancelledAppointment),
      isReplay: false,
    });
  });
}

export async function rescheduleAppointment(
  firestore: Firestore,
  patientId: string,
  request: RescheduleAppointmentRequest,
  now: Timestamp = Timestamp.now(),
): Promise<RescheduleAppointmentResult> {
  const appointmentReference = firestore.doc(`appointments/${request.appointmentId}`);
  const oldSlotReferenceForInput = firestore.doc(`availabilitySlots/${request.slotId}`);
  const operationReference = firestore.doc(
    `appointmentOperations/${deriveOperationId(patientId, request.requestId)}`,
  );

  return firestore.runTransaction(async (transaction) => {
    const [operationSnapshot, appointmentSnapshot] = await Promise.all([
      transaction.get(operationReference),
      transaction.get(appointmentReference),
    ]);

    if (operationSnapshot.exists) {
      return readOperationResult(operationSnapshot.data(), {
        appointmentId: request.appointmentId,
        operation: 'reschedule',
        slotId: request.slotId,
      });
    }

    if (!appointmentSnapshot.exists) {
      throw new HttpsError('not-found', 'This appointment does not exist.');
    }

    const appointment = parseStoredAppointment(appointmentSnapshot.data());
    assertAppointmentOwner(appointment, patientId);

    if (appointment.status !== 'confirmed') {
      throw new HttpsError(
        'failed-precondition',
        'Only confirmed appointments can be rescheduled.',
      );
    }

    // A retry after a committed reschedule is safe because the appointment already points to
    // the requested slot. The slot consistency check below keeps this path fail-closed.
    if (appointment.slotId === request.slotId) {
      const currentSlotSnapshot = await transaction.get(oldSlotReferenceForInput);

      if (!currentSlotSnapshot.exists) {
        throw new HttpsError('internal', 'The appointment has no matching availability slot.');
      }

      const currentSlot = parseStoredSlot(currentSlotSnapshot.data());
      assertBookedSlot(currentSlot, request.appointmentId);

      return rescheduleAppointmentResultSchema.parse({
        appointment: toAppointmentSummary(request.appointmentId, appointment),
        isReplay: true,
      });
    }

    validateAppointmentManagementLeadTime(appointment, now, 'reschedule');

    const oldSlotReference = firestore.doc(`availabilitySlots/${appointment.slotId}`);
    const [oldSlotSnapshot, targetSlotSnapshot] = await Promise.all([
      transaction.get(oldSlotReference),
      transaction.get(oldSlotReferenceForInput),
    ]);

    if (!oldSlotSnapshot.exists) {
      throw new HttpsError('internal', 'The appointment has no matching availability slot.');
    }

    if (!targetSlotSnapshot.exists) {
      throw new HttpsError('not-found', 'This appointment slot does not exist.');
    }

    const oldSlot = parseStoredSlot(oldSlotSnapshot.data());
    const targetSlot = parseStoredSlot(targetSlotSnapshot.data());
    assertBookedSlot(oldSlot, request.appointmentId);
    validateAvailableSlot(targetSlot, now);

    if (targetSlot.providerId !== appointment.providerId) {
      throw new HttpsError(
        'failed-precondition',
        'Rescheduling is only available with the same provider.',
      );
    }

    await validateSlotOwnership(transaction, firestore, targetSlot);

    const rescheduledAppointment = appointmentDocumentSchema.parse({
      ...appointment,
      cancelledAt: null,
      cancelledBy: null,
      clinicId: targetSlot.clinicId,
      endsAt: targetSlot.endsAt,
      slotId: request.slotId,
      startsAt: targetSlot.startsAt,
      status: 'confirmed',
      timezone: targetSlot.timezone,
      updatedAt: now,
      visitMode: targetSlot.visitMode,
    });
    const releasedSlot = availabilitySlotDocumentSchema.parse({
      ...oldSlot,
      appointmentId: null,
      status: 'available',
      updatedAt: now,
      version: oldSlot.version + 1,
    });
    const reservedSlot = availabilitySlotDocumentSchema.parse({
      ...targetSlot,
      appointmentId: request.appointmentId,
      status: 'booked',
      updatedAt: now,
      version: targetSlot.version + 1,
    });

    transaction.update(appointmentReference, {
      cancelledAt: null,
      cancelledBy: null,
      clinicId: rescheduledAppointment.clinicId,
      endsAt: rescheduledAppointment.endsAt,
      slotId: rescheduledAppointment.slotId,
      startsAt: rescheduledAppointment.startsAt,
      status: rescheduledAppointment.status,
      timezone: rescheduledAppointment.timezone,
      updatedAt: FieldValue.serverTimestamp(),
      visitMode: rescheduledAppointment.visitMode,
    });
    transaction.update(oldSlotReference, {
      appointmentId: releasedSlot.appointmentId,
      status: releasedSlot.status,
      updatedAt: FieldValue.serverTimestamp(),
      version: releasedSlot.version,
    });
    transaction.update(oldSlotReferenceForInput, {
      appointmentId: reservedSlot.appointmentId,
      status: reservedSlot.status,
      updatedAt: FieldValue.serverTimestamp(),
      version: reservedSlot.version,
    });

    transaction.create(operationReference, {
      appointmentId: request.appointmentId,
      createdAt: FieldValue.serverTimestamp(),
      operation: 'reschedule',
      result: {
        appointment: toAppointmentSummary(request.appointmentId, rescheduledAppointment),
        isReplay: false,
      },
      slotId: request.slotId,
      updatedAt: FieldValue.serverTimestamp(),
    });

    return rescheduleAppointmentResultSchema.parse({
      appointment: toAppointmentSummary(request.appointmentId, rescheduledAppointment),
      isReplay: false,
    });
  });
}

function deriveOperationId(patientId: string, requestId: string) {
  return createHash('sha256').update(patientId).update('\0').update(requestId).digest('hex');
}

function readOperationResult(
  input: unknown,
  expected: {
    appointmentId: string;
    operation: 'cancel';
    slotId: null;
  },
): CancelAppointmentResult;
function readOperationResult(
  input: unknown,
  expected: {
    appointmentId: string;
    operation: 'reschedule';
    slotId: string;
  },
): RescheduleAppointmentResult;
function readOperationResult(
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

function assertAppointmentOwner(appointment: AppointmentDocument, patientId: string) {
  if (appointment.patientId !== patientId) {
    throw new HttpsError('permission-denied', 'You can only manage your own appointments.');
  }
}

function assertBookedSlot(slot: ReturnType<typeof parseStoredSlot>, appointmentId: string) {
  if (slot.status !== 'booked' || slot.appointmentId !== appointmentId) {
    throw new HttpsError('internal', 'The appointment and availability slot are inconsistent.');
  }
}

function throwIfCancelledSlotIsNotReleased(slot: ReturnType<typeof parseStoredSlot>) {
  if (slot.status !== 'available' || slot.appointmentId !== null) {
    throw new HttpsError('internal', 'The cancelled appointment slot was not released.');
  }
}

function validateAppointmentManagementLeadTime(
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

function toAppointmentSummary(appointmentId: string, appointment: AppointmentDocument) {
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
