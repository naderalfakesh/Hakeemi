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
import { parseStoredAppointment, parseStoredSlot } from './slot-validation.js';
import {
  appointmentDocumentSchema,
  availabilitySlotDocumentSchema,
  cancelAppointmentRequestSchema,
  cancelAppointmentResultSchema,
  type CancelAppointmentRequest,
  type CancelAppointmentResult,
} from './contracts.js';

export function parseCancelAppointmentRequest(input: unknown): CancelAppointmentRequest {
  const parsedRequest = cancelAppointmentRequestSchema.safeParse(input);

  if (!parsedRequest.success) {
    throw new HttpsError('invalid-argument', 'Choose a valid appointment and try again.');
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

    if (appointment.status === 'cancelled') {
      if (appointment.cancelledBy !== 'patient') {
        throw new HttpsError('failed-precondition', 'This appointment cannot be cancelled again.');
      }

      throwIfCancelledSlotIsNotReleased(slot, request.appointmentId);
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

function throwIfCancelledSlotIsNotReleased(
  slot: ReturnType<typeof parseStoredSlot>,
  appointmentId: string,
) {
  if (slot.appointmentId === appointmentId) {
    throw new HttpsError('internal', 'The cancelled appointment slot was not released.');
  }
}
