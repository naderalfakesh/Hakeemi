import { Timestamp } from 'firebase-admin/firestore';
import { z } from 'zod';

export const APPOINTMENT_REASON_CATEGORIES = [
  'follow_up',
  'new_concern',
  'preventive_care',
  'routine_visit',
  'other',
] as const;

export const APPOINTMENT_STATUSES = ['confirmed', 'cancelled', 'completed', 'no_show'] as const;

export const SLOT_STATUSES = ['available', 'held', 'booked', 'blocked'] as const;
export const VISIT_MODES = ['in_person', 'video'] as const;

const documentIdSchema = z
  .string()
  .trim()
  .min(1)
  .max(128)
  .regex(/^[A-Za-z0-9][A-Za-z0-9_-]*$/);

const requestIdSchema = z
  .string()
  .trim()
  .regex(/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);

const timestampSchema = z.custom<Timestamp>((value) => value instanceof Timestamp);

export const bookAppointmentRequestSchema = z
  .object({
    reasonCategory: z.enum(APPOINTMENT_REASON_CATEGORIES).nullable().optional().default(null),
    requestId: requestIdSchema,
    slotId: documentIdSchema,
  })
  .strict();

export const bookAppointmentResultSchema = z
  .object({
    appointment: z
      .object({
        clinicId: documentIdSchema.nullable(),
        endsAt: z.string().datetime(),
        id: documentIdSchema,
        providerId: documentIdSchema,
        reasonCategory: z.enum(APPOINTMENT_REASON_CATEGORIES).nullable(),
        slotId: documentIdSchema,
        startsAt: z.string().datetime(),
        status: z.literal('confirmed'),
        timezone: z.string().trim().min(1).max(64),
        visitMode: z.enum(VISIT_MODES),
      })
      .strict(),
    isReplay: z.boolean(),
  })
  .strict();

const appointmentSummarySchema = z
  .object({
    cancelledAt: z.string().datetime().nullable(),
    cancelledBy: z.enum(['patient', 'provider', 'system']).nullable(),
    clinicId: documentIdSchema.nullable(),
    endsAt: z.string().datetime(),
    id: documentIdSchema,
    providerId: documentIdSchema,
    reasonCategory: z.enum(APPOINTMENT_REASON_CATEGORIES).nullable(),
    slotId: documentIdSchema,
    startsAt: z.string().datetime(),
    status: z.enum(APPOINTMENT_STATUSES),
    timezone: z.string().trim().min(1).max(64),
    visitMode: z.enum(VISIT_MODES),
  })
  .strict();

export const cancelAppointmentRequestSchema = z
  .object({
    appointmentId: documentIdSchema,
    requestId: requestIdSchema,
  })
  .strict();

export const cancelAppointmentResultSchema = z
  .object({
    appointment: appointmentSummarySchema,
    isReplay: z.boolean(),
  })
  .strict();

export const rescheduleAppointmentRequestSchema = z
  .object({
    appointmentId: documentIdSchema,
    requestId: requestIdSchema,
    slotId: documentIdSchema,
  })
  .strict();

export const rescheduleAppointmentResultSchema = z
  .object({
    appointment: appointmentSummarySchema,
    isReplay: z.boolean(),
  })
  .strict();

export const availabilitySlotDocumentSchema = z
  .object({
    appointmentId: documentIdSchema.nullable(),
    clinicId: documentIdSchema.nullable(),
    createdAt: timestampSchema,
    endsAt: timestampSchema,
    providerId: documentIdSchema,
    schemaVersion: z.literal(1),
    startsAt: timestampSchema,
    status: z.enum(SLOT_STATUSES),
    timezone: z.string().trim().min(1).max(64),
    updatedAt: timestampSchema,
    version: z.number().int().positive(),
    visitMode: z.enum(VISIT_MODES),
  })
  .strict()
  .superRefine((slot, context) => {
    const durationMilliseconds = slot.endsAt.toMillis() - slot.startsAt.toMillis();

    if (durationMilliseconds <= 0) {
      context.addIssue({
        code: 'custom',
        message: 'Slot end must be later than its start.',
        path: ['endsAt'],
      });
    }

    if (durationMilliseconds > 180 * 60 * 1_000) {
      context.addIssue({
        code: 'custom',
        message: 'Slots cannot be longer than 180 minutes.',
        path: ['endsAt'],
      });
    }

    if (slot.visitMode === 'in_person' && slot.clinicId === null) {
      context.addIssue({
        code: 'custom',
        message: 'In-person slots require a clinic.',
        path: ['clinicId'],
      });
    }

    if (slot.status === 'booked' && slot.appointmentId === null) {
      context.addIssue({
        code: 'custom',
        message: 'Booked slots require an appointment.',
        path: ['appointmentId'],
      });
    }

    if (slot.status !== 'booked' && slot.appointmentId !== null) {
      context.addIssue({
        code: 'custom',
        message: 'Only booked slots may reference an appointment.',
        path: ['appointmentId'],
      });
    }
  });

export const appointmentDocumentSchema = z
  .object({
    cancelledAt: timestampSchema.nullable(),
    cancelledBy: z.enum(['patient', 'provider', 'system']).nullable(),
    clinicId: documentIdSchema.nullable(),
    createdAt: timestampSchema,
    endsAt: timestampSchema,
    patientId: documentIdSchema,
    providerId: documentIdSchema,
    reasonCategory: z.enum(APPOINTMENT_REASON_CATEGORIES).nullable(),
    schemaVersion: z.literal(1),
    slotId: documentIdSchema,
    startsAt: timestampSchema,
    status: z.enum(APPOINTMENT_STATUSES),
    timezone: z.string().trim().min(1).max(64),
    updatedAt: timestampSchema,
    visitMode: z.enum(VISIT_MODES),
  })
  .strict()
  .superRefine((appointment, context) => {
    if (appointment.endsAt.toMillis() <= appointment.startsAt.toMillis()) {
      context.addIssue({
        code: 'custom',
        message: 'Appointment end must be later than its start.',
        path: ['endsAt'],
      });
    }

    if (appointment.visitMode === 'in_person' && appointment.clinicId === null) {
      context.addIssue({
        code: 'custom',
        message: 'In-person appointments require a clinic.',
        path: ['clinicId'],
      });
    }

    const hasCancellationMetadata =
      appointment.cancelledAt !== null && appointment.cancelledBy !== null;

    if (appointment.status === 'cancelled' && !hasCancellationMetadata) {
      context.addIssue({
        code: 'custom',
        message: 'Cancelled appointments require complete cancellation metadata.',
        path: ['cancelledAt'],
      });
    }

    if (
      appointment.status !== 'cancelled' &&
      (appointment.cancelledAt !== null || appointment.cancelledBy !== null)
    ) {
      context.addIssue({
        code: 'custom',
        message: 'Only cancelled appointments may contain cancellation metadata.',
        path: ['cancelledAt'],
      });
    }
  });

export type AppointmentDocument = z.infer<typeof appointmentDocumentSchema>;
export type AvailabilitySlotDocument = z.infer<typeof availabilitySlotDocumentSchema>;
export type BookAppointmentRequest = z.infer<typeof bookAppointmentRequestSchema>;
export type BookAppointmentResult = z.infer<typeof bookAppointmentResultSchema>;
export type CancelAppointmentRequest = z.infer<typeof cancelAppointmentRequestSchema>;
export type CancelAppointmentResult = z.infer<typeof cancelAppointmentResultSchema>;
export type RescheduleAppointmentRequest = z.infer<typeof rescheduleAppointmentRequestSchema>;
export type RescheduleAppointmentResult = z.infer<typeof rescheduleAppointmentResultSchema>;
