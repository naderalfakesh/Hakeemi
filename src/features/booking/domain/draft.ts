import { z } from 'zod';

import {
  appointmentReasonCategories,
  type AppointmentReasonCategory,
} from '@/features/appointments/domain/types';

const DRAFT_LIFETIME_MS = 24 * 60 * 60 * 1_000;

export type BookingDraft = {
  providerId: string;
  reasonCategory: AppointmentReasonCategory | null;
  requestId: string;
  slotId: string;
  updatedAt: string;
};

export const bookingDraftSchema = z
  .object({
    providerId: z.string().min(1).max(128),
    reasonCategory: z.enum(appointmentReasonCategories).nullable(),
    requestId: z.uuid(),
    slotId: z.string().min(1).max(128),
    updatedAt: z.iso.datetime(),
  })
  .strict();

export function createBookingDraft(
  providerId: string,
  slotId: string,
  requestId: string,
  now = new Date(),
): BookingDraft {
  return bookingDraftSchema.parse({
    providerId,
    reasonCategory: null,
    requestId,
    slotId,
    updatedAt: now.toISOString(),
  });
}

export function restoreBookingDraft(input: unknown, now = new Date()) {
  const result = bookingDraftSchema.safeParse(input);

  if (!result.success) {
    return null;
  }

  return now.getTime() - new Date(result.data.updatedAt).getTime() <= DRAFT_LIFETIME_MS
    ? result.data
    : null;
}
