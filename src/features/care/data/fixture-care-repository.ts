import type { CareRepository } from '../domain/repository';
import type { ProviderSearch } from '../domain/types';
import {
  buildAvailabilityFixtures,
  clinicFixtures,
  providerFixtures,
  specialtyFixtures,
} from './fixtures';
import { selectProviders } from './selectors';

export class FixtureCareRepository implements CareRepository {
  public constructor(private readonly now: () => Date = () => new Date()) {}

  public async getClinic(id: string) {
    return clinicFixtures.find((clinic) => clinic.id === id) ?? null;
  }

  public async getProvider(id: string) {
    return providerFixtures.find((provider) => provider.id === id && provider.isActive) ?? null;
  }

  public async listAvailableSlots(providerId: string) {
    return buildAvailabilityFixtures(this.now())
      .filter((slot) => slot.providerId === providerId)
      .sort((left, right) => left.startsAt.localeCompare(right.startsAt));
  }

  public async listClinics() {
    return clinicFixtures.filter((clinic) => clinic.isActive);
  }

  public async listProviders(search: ProviderSearch = {}) {
    return selectProviders(providerFixtures, specialtyFixtures, search);
  }

  public async listSpecialties() {
    return specialtyFixtures
      .filter((specialty) => specialty.isActive)
      .sort((left, right) => left.sortOrder - right.sortOrder);
  }
}

export const fixtureCareRepository: CareRepository = new FixtureCareRepository();
