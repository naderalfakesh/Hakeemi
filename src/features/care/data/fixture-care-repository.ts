import type { CareRepository } from '../domain/repository';
import { parseAvailabilityWindow } from '../domain/availability';
import type { AvailabilityWindow, Provider, ProviderSearch } from '../domain/types';
import {
  buildAvailabilityFixtures,
  clinicFixtures,
  providerFixtures,
  specialtyFixtures,
} from './fixtures';
import { selectProviders } from './selectors';
import { compareProviderToCursor, createProviderCursor } from './provider-cursor';

const DEFAULT_PROVIDER_PAGE_SIZE = 12;

export class FixtureCareRepository implements CareRepository {
  public constructor(private readonly now: () => Date = () => new Date()) {}

  public async getClinic(id: string) {
    return clinicFixtures.find((clinic) => clinic.id === id) ?? null;
  }

  public async getProvider(id: string) {
    return providerFixtures.find((provider) => provider.id === id && provider.isActive) ?? null;
  }

  public async listAvailableSlots(providerId: string, window: AvailabilityWindow) {
    const { endsBefore, startsAtOrAfter } = parseAvailabilityWindow(window);

    return buildAvailabilityFixtures(this.now())
      .filter(
        (slot) =>
          slot.providerId === providerId &&
          new Date(slot.startsAt) >= startsAtOrAfter &&
          new Date(slot.startsAt) < endsBefore,
      )
      .sort((left, right) => left.startsAt.localeCompare(right.startsAt))
      .slice(0, 31);
  }

  public async listClinics() {
    return clinicFixtures.filter((clinic) => clinic.isActive);
  }

  public async listProviderPage(
    search: ProviderSearch = {},
    cursor: string | null = null,
    pageSize = DEFAULT_PROVIDER_PAGE_SIZE,
  ) {
    const safePageSize =
      Number.isFinite(pageSize) && pageSize > 0 ? Math.floor(pageSize) : DEFAULT_PROVIDER_PAGE_SIZE;
    const candidates = (providerFixtures as readonly Provider[])
      .filter((provider) => provider.isActive)
      .filter(
        (provider) => !search.specialtyId || provider.specialtyIds.includes(search.specialtyId),
      )
      .sort(
        (left, right) =>
          Number(right.isFeatured) - Number(left.isFeatured) ||
          left.displayName.localeCompare(right.displayName) ||
          left.id.localeCompare(right.id),
      );
    const pageStart = cursor
      ? candidates.findIndex((provider) => compareProviderToCursor(provider, cursor) > 0)
      : 0;
    const safePageStart = pageStart < 0 ? candidates.length : pageStart;
    const pageCandidates = candidates.slice(safePageStart, safePageStart + safePageSize);
    const hasNextPage = safePageStart + safePageSize < candidates.length;
    const lastProvider = pageCandidates[pageCandidates.length - 1];

    return {
      items: selectProviders(pageCandidates, specialtyFixtures, search),
      nextCursor:
        hasNextPage && lastProvider !== undefined ? createProviderCursor(lastProvider) : null,
    };
  }

  public async listSpecialties() {
    return specialtyFixtures
      .filter((specialty) => specialty.isActive)
      .sort((left, right) => left.sortOrder - right.sortOrder);
  }
}

export const fixtureCareRepository: CareRepository = new FixtureCareRepository();
