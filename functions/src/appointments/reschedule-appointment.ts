import { FieldValue, type Firestore, Timestamp } from 'firebase-admin/firestore';
import { HttpsError } from 'firebase-functions/v2/https';

import {
  assertAppointmentOwner,
  assertBookedSlot,
  deriveOperationId,
  readOperationResult,
  toAppointmentSummary,
  validateAppointmentManagementLeadTime,
} from './appointment-management.js';
import {
  parseStoredAppointment,
  parseStoredSlot,
  validateAvailableSlot,
  validateSlotOwnership,
} from './slot-validation.js';
import {
  appointmentDocumentSchema,
  availabilitySlotDocumentSchema,
  rescheduleAppointmentRequestSchema,
  rescheduleAppointmentResultSchema,
  type RescheduleAppointmentRequest,
  type RescheduleAppointmentResult,
} from './contracts.js';
import { deriveReminderId } from '../notifications/reminder-policy.js';

export function parseRescheduleAppointmentRequest(input: unknown): RescheduleAppointmentRequest {
  const parsedRequest = rescheduleAppointmentRequestSchema.safeParse(input);

  if (!parsedRequest.success) {
    throw new HttpsError('invalid-argument', 'Choose a valid appointment slot and try again.');
  }

  return parsedRequest.data;
}

export async function rescheduleAppointment(
  firestore: Firestore,
  patientId: string,
  request: RescheduleAppointmentRequest,
  now: Timestamp = Timestamp.now(),
): Promise<RescheduleAppointmentResult> {
  const appointmentReference = firestore.doc(`appointments/${request.appointmentId}`);
  const targetSlotReference = firestore.doc(`availabilitySlots/${request.slotId}`);
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

    if (appointment.slotId === request.slotId) {
      const currentSlotSnapshot = await transaction.get(targetSlotReference);

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
      transaction.get(targetSlotReference),
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
    transaction.update(targetSlotReference, {
      appointmentId: reservedSlot.appointmentId,
      status: reservedSlot.status,
      updatedAt: FieldValue.serverTimestamp(),
      version: reservedSlot.version,
    });
    // Drop the old reminder receipt so the rescheduled time receives its own reminder.
    transaction.delete(
      firestore.doc(`appointmentReminders/${deriveReminderId(request.appointmentId)}`),
    );

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
