import type {
  AvailabilitySlot,
  AvailabilityWindow,
  Clinic,
  Provider,
  ProviderSearch,
  Specialty,
} from './types';

export type ProviderPageCursor = string;

export type ProviderPage = {
  items: readonly Provider[];
  nextCursor: ProviderPageCursor | null;
};

export interface CareRepository {
  getClinic(id: string): Promise<Clinic | null>;
  getProvider(id: string): Promise<Provider | null>;
  listAvailableSlots(
    providerId: string,
    window: AvailabilityWindow,
  ): Promise<readonly AvailabilitySlot[]>;
  listClinics(): Promise<readonly Clinic[]>;
  listProviderPage(
    search?: ProviderSearch,
    cursor?: ProviderPageCursor | null,
    pageSize?: number,
  ): Promise<ProviderPage>;
  listSpecialties(): Promise<readonly Specialty[]>;
}
