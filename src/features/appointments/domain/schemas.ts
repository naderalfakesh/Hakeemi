import { z } from 'zod';

import { appointmentReasonCategories, type Appointment } from './types';

type TimestampLike = {
  toDate(): Date;
};

const timestampSchema = z.custom<TimestampLike>((value) => {
  const candidate = value as { toDate?: unknown } | null;
  return (
    candidate !== null && typeof candidate === 'object' && typeof candidate.toDate === 'function'
  );
});

const identifierSchema = z.string().min(1).max(128);
const visitModeSchema = z.enum(['in_person', 'video']);

const appointmentDocumentSchema = z.object({
  cancelledAt: timestampSchema.nullable(),
  cancelledBy: z.enum(['patient', 'provider', 'system']).nullable(),
  clinicId: identifierSchema.nullable(),
  createdAt: timestampSchema,
  endsAt: timestampSchema,
  patientId: identifierSchema,
  providerId: identifierSchema,
  reasonCategory: z.enum(appointmentReasonCategories).nullable(),
  slotId: identifierSchema,
  startsAt: timestampSchema,
  status: z.enum(['confirmed', 'cancelled', 'completed', 'no_show']),
  timezone: z.string().min(1).max(64),
  updatedAt: timestampSchema,
  visitMode: visitModeSchema,
});

export const bookAppointmentResultSchema = z.object({
  appointment: z.object({
    clinicId: identifierSchema.nullable(),
    endsAt: z.iso.datetime(),
    id: identifierSchema,
    providerId: identifierSchema,
    reasonCategory: z.enum(appointmentReasonCategories).nullable(),
    slotId: identifierSchema,
    startsAt: z.iso.datetime(),
    status: z.literal('confirmed'),
    timezone: z.string().min(1).max(64),
    visitMode: visitModeSchema,
  }),
  isReplay: z.boolean(),
});

export class AppointmentDataValidationError extends Error {
  public override readonly name = 'AppointmentDataValidationError';

  public constructor(documentId: string, validationError: z.ZodError) {
    super(`Invalid appointments/${documentId} document`);
    this.cause = validationError;
  }
}

export function mapAppointmentDocument(documentId: string, data: unknown): Appointment {
  const result = appointmentDocumentSchema.safeParse(data);

  if (!result.success) {
    throw new AppointmentDataValidationError(documentId, result.error);
  }

  const appointment = result.data;

  return {
    ...appointment,
    cancelledAt: appointment.cancelledAt?.toDate().toISOString() ?? null,
    createdAt: appointment.createdAt.toDate().toISOString(),
    endsAt: appointment.endsAt.toDate().toISOString(),
    id: documentId,
    startsAt: appointment.startsAt.toDate().toISOString(),
    updatedAt: appointment.updatedAt.toDate().toISOString(),
  };
}
