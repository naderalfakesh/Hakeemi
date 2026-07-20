import { Timestamp } from 'firebase-admin/firestore';

import type { SeedCatalog } from './catalog-schema';

type SeedDocument = {
  data: Record<string, unknown>;
  id: string;
};

export type SeedDocuments = {
  availabilitySlots: readonly SeedDocument[];
  clinics: readonly SeedDocument[];
  providers: readonly SeedDocument[];
  specialties: readonly SeedDocument[];
};

function normalizeSearchTerm(value: string) {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('en')
    .trim();
}

function startOfUtcDay(referenceDate: string) {
  const parsedDate = new Date(`${referenceDate}T00:00:00.000Z`);

  if (Number.isNaN(parsedDate.getTime())) {
    throw new Error(`Invalid seed reference date: ${referenceDate}`);
  }

  return parsedDate;
}

export function buildSeedDocuments(catalog: SeedCatalog, referenceDate: string): SeedDocuments {
  const anchor = startOfUtcDay(referenceDate);
  const auditTimestamp = Timestamp.fromDate(anchor);
  const nextAvailabilityByProvider = new Map<string, Timestamp>();

  const availabilitySlots = catalog.slots.map((slot) => {
    const [hourText, minuteText] = slot.startTimeUtc.split(':');
    const startsAt = new Date(anchor);
    startsAt.setUTCDate(startsAt.getUTCDate() + slot.dayOffset);
    startsAt.setUTCHours(Number(hourText), Number(minuteText), 0, 0);

    const startsAtTimestamp = Timestamp.fromDate(startsAt);
    const endsAtTimestamp = Timestamp.fromMillis(
      startsAt.getTime() + slot.durationMinutes * 60_000,
    );
    const currentNextAvailability = nextAvailabilityByProvider.get(slot.providerId);

    if (
      currentNextAvailability === undefined ||
      startsAtTimestamp.toMillis() < currentNextAvailability.toMillis()
    ) {
      nextAvailabilityByProvider.set(slot.providerId, startsAtTimestamp);
    }

    return {
      id: slot.id,
      data: {
        appointmentId: null,
        clinicId: slot.clinicId,
        createdAt: auditTimestamp,
        endsAt: endsAtTimestamp,
        providerId: slot.providerId,
        schemaVersion: 1,
        startsAt: startsAtTimestamp,
        status: 'available',
        timezone: 'Asia/Dubai',
        updatedAt: auditTimestamp,
        version: 1,
        visitMode: slot.visitMode,
      },
    };
  });

  const specialtyNameById = new Map(
    catalog.specialties.map((specialty) => [specialty.id, specialty.name.en]),
  );

  const providers = catalog.providers.map((provider) => {
    const nextAvailableAt = nextAvailabilityByProvider.get(provider.id);

    if (nextAvailableAt === undefined) {
      throw new Error(`Provider ${provider.id} has no availability slots`);
    }

    const searchTerms = new Set([
      provider.displayName,
      provider.slug,
      ...provider.languages,
      ...provider.specialtyIds.map((specialtyId) => specialtyNameById.get(specialtyId) ?? ''),
    ]);

    return {
      id: provider.id,
      data: {
        ...provider,
        nextAvailableAt,
        schemaVersion: 1,
        searchTerms: [...searchTerms].filter(Boolean).map(normalizeSearchTerm).sort(),
      },
    };
  });

  return {
    availabilitySlots,
    clinics: catalog.clinics.map(({ id, ...data }) => ({
      id,
      data: { ...data, schemaVersion: 1 },
    })),
    providers,
    specialties: catalog.specialties.map(({ id, ...data }) => ({
      id,
      data: { ...data, schemaVersion: 1 },
    })),
  };
}
