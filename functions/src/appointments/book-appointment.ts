import { createHash } from 'node:crypto';

import { FieldValue, type Firestore, Timestamp } from 'firebase-admin/firestore';
import { HttpsError } from 'firebase-functions/v2/https';

import {
  appointmentDocumentSchema,
  availabilitySlotDocumentSchema,
  bookAppointmentRequestSchema,
  bookAppointmentResultSchema,
  type AppointmentDocument,
  type BookAppointmentRequest,
  type BookAppointmentResult,
} from './contracts.js';
import {
  parseStoredAppointment,
  parseStoredSlot,
  validateAvailableSlot,
  validateSlotOwnership,
} from './slot-validation.js';

export function parseBookAppointmentRequest(input: unknown): BookAppointmentRequest {
  const parsedRequest = bookAppointmentRequestSchema.safeParse(input);

  if (!parsedRequest.success) {
    throw new HttpsError('invalid-argument', 'Choose a valid appointment slot and try again.');
  }

  return parsedRequest.data;
}

export function deriveAppointmentId(patientId: string, requestId: string) {
  const digest = createHash('sha256')
    .update(patientId)
    .update('\0')
    .update(requestId)
    .digest('hex');

  return `appointment-${digest}`;
}

export async function reserveAppointment(
  firestore: Firestore,
  patientId: string,
  request: BookAppointmentRequest,
  now: Timestamp = Timestamp.now(),
): Promise<BookAppointmentResult> {
  const appointmentId = deriveAppointmentId(patientId, request.requestId);
  const appointmentReference = firestore.doc(`appointments/${appointmentId}`);
  const slotReference = firestore.doc(`availabilitySlots/${request.slotId}`);

  return firestore.runTransaction(async (transaction) => {
    const [appointmentSnapshot, slotSnapshot] = await Promise.all([
      transaction.get(appointmentReference),
      transaction.get(slotReference),
    ]);

    if (appointmentSnapshot.exists) {
      const appointment = parseStoredAppointment(appointmentSnapshot.data());

      if (
        appointment.patientId !== patientId ||
        appointment.slotId !== request.slotId ||
        appointment.reasonCategory !== request.reasonCategory
      ) {
        throw new HttpsError(
          'failed-precondition',
          'This booking request has already been used for another appointment.',
        );
      }

      if (appointment.status !== 'confirmed') {
        throw new HttpsError(
          'failed-precondition',
          'This booking request is no longer associated with a confirmed appointment.',
        );
      }

      if (!slotSnapshot.exists) {
        throw new HttpsError('internal', 'The existing appointment has no matching slot.');
      }

      const slot = parseStoredSlot(slotSnapshot.data());

      if (slot.status !== 'booked' || slot.appointmentId !== appointmentId) {
        throw new HttpsError('internal', 'The existing appointment has inconsistent slot data.');
      }

      return toBookingResult(appointmentId, appointment, true);
    }

    if (!slotSnapshot.exists) {
      throw new HttpsError('not-found', 'This appointment slot does not exist.');
    }

    const slot = parseStoredSlot(slotSnapshot.data());

    validateAvailableSlot(slot, now);
    await validateSlotOwnership(transaction, firestore, slot);

    const appointment = appointmentDocumentSchema.parse({
      cancelledAt: null,
      cancelledBy: null,
      clinicId: slot.clinicId,
      createdAt: now,
      endsAt: slot.endsAt,
      patientId,
      providerId: slot.providerId,
      reasonCategory: request.reasonCategory,
      schemaVersion: 1,
      slotId: request.slotId,
      startsAt: slot.startsAt,
      status: 'confirmed',
      timezone: slot.timezone,
      updatedAt: now,
      visitMode: slot.visitMode,
    });

    availabilitySlotDocumentSchema.parse({
      ...slot,
      appointmentId,
      status: 'booked',
      updatedAt: now,
      version: slot.version + 1,
    });

    transaction.create(appointmentReference, {
      ...appointment,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
    transaction.update(slotReference, {
      appointmentId,
      status: 'booked',
      updatedAt: FieldValue.serverTimestamp(),
      version: slot.version + 1,
    });

    return toBookingResult(appointmentId, appointment, false);
  });
}

function toBookingResult(
  appointmentId: string,
  appointment: AppointmentDocument,
  isReplay: boolean,
): BookAppointmentResult {
  return bookAppointmentResultSchema.parse({
    appointment: {
      clinicId: appointment.clinicId,
      endsAt: appointment.endsAt.toDate().toISOString(),
      id: appointmentId,
      providerId: appointment.providerId,
      reasonCategory: appointment.reasonCategory,
      slotId: appointment.slotId,
      startsAt: appointment.startsAt.toDate().toISOString(),
      status: 'confirmed',
      timezone: appointment.timezone,
      visitMode: appointment.visitMode,
    },
    isReplay,
  });
}
