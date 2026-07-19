import { z } from 'zod';

const localizedTextSchema = z.object({
  ar: z.string().min(1),
  en: z.string().min(1),
});

const visitModeSchema = z.enum(['in_person', 'video']);

const specialtySchema = z.object({
  description: localizedTextSchema,
  icon: z.string().min(1),
  id: z.string().min(1),
  isActive: z.boolean(),
  name: localizedTextSchema,
  sortOrder: z.number().int().positive(),
});

const clinicSchema = z.object({
  address: localizedTextSchema,
  city: localizedTextSchema,
  id: z.string().min(1),
  isActive: z.boolean(),
  name: localizedTextSchema,
  timezone: z.string().min(1),
});

const providerSchema = z.object({
  bio: z.string().min(1),
  clinicIds: z.array(z.string().min(1)).min(1),
  consultationFee: z.object({
    amount: z.number().int().nonnegative(),
    currency: z.literal('AED'),
  }),
  credentialSummary: z.string().min(1),
  displayName: z.string().min(1),
  id: z.string().min(1),
  image: z.null(),
  isActive: z.boolean(),
  isFeatured: z.boolean(),
  languages: z.array(z.string().min(1)).min(1),
  ratingSummary: z.object({
    average: z.number().min(0).max(5),
    count: z.number().int().nonnegative(),
  }),
  slug: z.string().min(1),
  specialtyIds: z.array(z.string().min(1)).min(1),
  visitModes: z.array(visitModeSchema).min(1),
});

const slotSchema = z.object({
  clinicId: z.string().min(1).nullable(),
  dayOffset: z.number().int().positive(),
  durationMinutes: z.number().int().positive().max(180),
  id: z.string().min(1),
  providerId: z.string().min(1),
  startTimeUtc: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  visitMode: visitModeSchema,
});

export const seedCatalogSchema = z
  .object({
    clinics: z.array(clinicSchema).min(1),
    providers: z.array(providerSchema).min(1),
    slots: z.array(slotSchema).min(1),
    specialties: z.array(specialtySchema).min(1),
    version: z.string().min(1),
  })
  .superRefine((catalog, context) => {
    const clinicIds = new Set(catalog.clinics.map(({ id }) => id));
    const providerIds = new Set(catalog.providers.map(({ id }) => id));
    const specialtyIds = new Set(catalog.specialties.map(({ id }) => id));

    for (const [providerIndex, provider] of catalog.providers.entries()) {
      for (const clinicId of provider.clinicIds) {
        if (!clinicIds.has(clinicId)) {
          context.addIssue({
            code: 'custom',
            message: `Unknown clinic ${clinicId}`,
            path: ['providers', providerIndex, 'clinicIds'],
          });
        }
      }

      for (const specialtyId of provider.specialtyIds) {
        if (!specialtyIds.has(specialtyId)) {
          context.addIssue({
            code: 'custom',
            message: `Unknown specialty ${specialtyId}`,
            path: ['providers', providerIndex, 'specialtyIds'],
          });
        }
      }
    }

    for (const [slotIndex, slot] of catalog.slots.entries()) {
      if (!providerIds.has(slot.providerId)) {
        context.addIssue({
          code: 'custom',
          message: `Unknown provider ${slot.providerId}`,
          path: ['slots', slotIndex, 'providerId'],
        });
      }

      if (slot.clinicId !== null && !clinicIds.has(slot.clinicId)) {
        context.addIssue({
          code: 'custom',
          message: `Unknown clinic ${slot.clinicId}`,
          path: ['slots', slotIndex, 'clinicId'],
        });
      }
    }
  });

export type SeedCatalog = z.infer<typeof seedCatalogSchema>;
