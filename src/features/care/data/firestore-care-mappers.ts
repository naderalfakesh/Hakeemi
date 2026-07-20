import { z } from 'zod';

import type { AvailabilitySlot, Clinic, Provider, Specialty } from '../domain/types';

type TimestampLike = {
  toDate(): Date;
};

const localizedTextSchema = z.object({
  ar: z.string().min(1),
  en: z.string().min(1),
});

const visitModeSchema = z.enum(['in_person', 'video']);

const timestampSchema = z.custom<TimestampLike>(
  (value) => {
    const candidate = value as { toDate?: unknown } | null;
    return (
      candidate !== null && typeof candidate === 'object' && typeof candidate.toDate === 'function'
    );
  },
  { message: 'Expected a Firestore timestamp' },
);

const specialtyDocumentSchema = z.object({
  description: localizedTextSchema,
  icon: z.string().min(1),
  isActive: z.boolean(),
  name: localizedTextSchema,
  sortOrder: z.number().int().nonnegative(),
});

const clinicDocumentSchema = z.object({
  address: localizedTextSchema,
  city: localizedTextSchema,
  isActive: z.boolean(),
  name: localizedTextSchema,
  timezone: z.string().min(1),
});

const providerDocumentSchema = z.object({
  bio: z.string().min(1),
  bioAr: z.string().min(1).optional(),
  clinicIds: z.array(z.string().min(1)).min(1),
  consultationFee: z
    .object({
      amount: z.number().int().nonnegative(),
      currency: z.literal('AED'),
    })
    .nullable(),
  credentialSummary: z.string().min(1),
  credentialSummaryAr: z.string().min(1).optional(),
  displayName: z.string().min(1),
  displayNameAr: z.string().min(1).optional(),
  image: z
    .object({
      alt: z.string().min(1),
      blurhash: z.string().min(1),
      url: z.url(),
    })
    .nullable(),
  isActive: z.boolean(),
  isFeatured: z.boolean(),
  languages: z.array(z.string().min(1)).min(1),
  languagesAr: z.array(z.string().min(1)).optional(),
  ratingSummary: z
    .object({
      average: z.number().min(0).max(5),
      count: z.number().int().nonnegative(),
    })
    .nullable(),
  slug: z.string().min(1),
  specialtyIds: z.array(z.string().min(1)).min(1),
  visitModes: z.array(visitModeSchema).min(1),
});

const availabilitySlotDocumentSchema = z
  .object({
    clinicId: z.string().min(1).nullable(),
    endsAt: timestampSchema,
    providerId: z.string().min(1),
    startsAt: timestampSchema,
    status: z.literal('available'),
    timezone: z.string().min(1),
    visitMode: visitModeSchema,
  })
  .superRefine(({ endsAt, startsAt }, context) => {
    if (endsAt.toDate().getTime() <= startsAt.toDate().getTime()) {
      context.addIssue({
        code: 'custom',
        message: 'Availability must end after it starts',
        path: ['endsAt'],
      });
    }
  });

export class CareDataValidationError extends Error {
  public override readonly name = 'CareDataValidationError';

  public constructor(
    public readonly collection: string,
    public readonly documentId: string,
    public readonly validationError: z.ZodError,
  ) {
    super(`Invalid ${collection}/${documentId} document`);
  }
}

function parseDocument<T>(
  collection: string,
  documentId: string,
  schema: z.ZodType<T>,
  data: unknown,
) {
  const result = schema.safeParse(data);

  if (!result.success) {
    throw new CareDataValidationError(collection, documentId, result.error);
  }

  return result.data;
}

export function mapSpecialtyDocument(documentId: string, data: unknown): Specialty {
  return {
    id: documentId,
    ...parseDocument('specialties', documentId, specialtyDocumentSchema, data),
  };
}

export function mapClinicDocument(documentId: string, data: unknown): Clinic {
  return {
    id: documentId,
    ...parseDocument('clinics', documentId, clinicDocumentSchema, data),
  };
}

export function mapProviderDocument(documentId: string, data: unknown): Provider {
  const {
    bio,
    bioAr,
    credentialSummary,
    credentialSummaryAr,
    displayName,
    displayNameAr,
    languages,
    languagesAr,
    ...rest
  } = parseDocument('providers', documentId, providerDocumentSchema, data);

  // Untranslated documents fall back to their English text so partially
  // migrated backend data stays renderable in Arabic.
  return {
    id: documentId,
    ...rest,
    bio: { ar: bioAr ?? bio, en: bio },
    credentialSummary: { ar: credentialSummaryAr ?? credentialSummary, en: credentialSummary },
    displayName: { ar: displayNameAr ?? displayName, en: displayName },
    languages: languages.map((language, index) => ({
      ar: languagesAr?.[index] ?? language,
      en: language,
    })),
  };
}

export function mapAvailabilitySlotDocument(documentId: string, data: unknown): AvailabilitySlot {
  const parsed = parseDocument(
    'availabilitySlots',
    documentId,
    availabilitySlotDocumentSchema,
    data,
  );

  return {
    ...parsed,
    endsAt: parsed.endsAt.toDate().toISOString(),
    id: documentId,
    startsAt: parsed.startsAt.toDate().toISOString(),
  };
}
