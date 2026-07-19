import type { AvailabilitySlot, Clinic, Provider, ProviderSearch, Specialty } from './types';

export interface CareRepository {
  getClinic(id: string): Promise<Clinic | null>;
  getProvider(id: string): Promise<Provider | null>;
  listAvailableSlots(providerId: string): Promise<readonly AvailabilitySlot[]>;
  listClinics(): Promise<readonly Clinic[]>;
  listProviders(search?: ProviderSearch): Promise<readonly Provider[]>;
  listSpecialties(): Promise<readonly Specialty[]>;
}
