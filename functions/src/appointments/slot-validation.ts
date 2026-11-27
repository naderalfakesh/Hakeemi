import { type Firestore, type Timestamp, type Transaction } from 'firebase-admin/firestore';
import { HttpsError } from 'firebase-functions/v2/https';
import { z } from 'zod';

import {
  appointmentDocumentSchema,
  availabilitySlotDocumentSchema,
  type AppointmentDocument,
  type AvailabilitySlotDocument,
} from './contracts.js';

export const MINIMUM_LEAD_TIME_MS = 15 * 60 * 1_000;
export const MAXIMUM_BOOKING_HORIZON_MS = 90 * 24 * 60 * 60 * 1_000;

const providerBookingSchema = z.object({
  clinicIds: z.array(z.string()),
  isActive: z.literal(true),
  visitModes: z.array(z.enum(['in_person', 'video'])),
});

const clinicBookingSchema = z.object({
  isActive: z.literal(true),
});

export function parseStoredSlot(input: unknown): AvailabilitySlotDocument {
  const parsedSlot = availabilitySlotDocumentSchema.safeParse(input);

  if (!parsedSlot.success) {
    throw new HttpsError('failed-precondition', 'This appointment slot is unavailable.');
  }

  return parsedSlot.data;
}

export function parseStoredAppointment(input: unknown): AppointmentDocument {
  const parsedAppointment = appointmentDocumentSchema.safeParse(input);

  if (!parsedAppointment.success) {
    throw new HttpsError('internal', 'The existing appointment data is invalid.');
  }

  return parsedAppointment.data;
}

export function validateAvailableSlot(slot: AvailabilitySlotDocument, now: Timestamp) {
  if (slot.status !== 'available') {
    throw new HttpsError('already-exists', 'This appointment slot is no longer available.');
  }

  const timeUntilStart = slot.startsAt.toMillis() - now.toMillis();

  if (timeUntilStart < MINIMUM_LEAD_TIME_MS) {
    throw new HttpsError('failed-precondition', 'This appointment slot is too close to its start.');
  }

  if (timeUntilStart > MAXIMUM_BOOKING_HORIZON_MS) {
    throw new HttpsError(
      'failed-precondition',
      'This appointment slot is outside the booking window.',
    );
  }
}

export async function validateSlotOwnership(
  transaction: Transaction,
  firestore: Firestore,
  slot: AvailabilitySlotDocument,
) {
  const providerReference = firestore.doc(`providers/${slot.providerId}`);
  const providerSnapshot = await transaction.get(providerReference);
  const provider = providerBookingSchema.safeParse(providerSnapshot.data());

  if (
    !providerSnapshot.exists ||
    !provider.success ||
    !provider.data.visitModes.includes(slot.visitMode) ||
    (slot.clinicId !== null && !provider.data.clinicIds.includes(slot.clinicId))
  ) {
    throw new HttpsError('failed-precondition', 'The provider cannot accept this appointment.');
  }

  if (slot.clinicId === null) {
    return;
  }

  const clinicSnapshot = await transaction.get(firestore.doc(`clinics/${slot.clinicId}`));

  if (!clinicSnapshot.exists || !clinicBookingSchema.safeParse(clinicSnapshot.data()).success) {
    throw new HttpsError('failed-precondition', 'The clinic cannot accept this appointment.');
  }
}
