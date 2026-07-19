import { useQuery } from '@tanstack/react-query';
import { useCallback } from 'react';

import { careRepository } from '@/features/care/data/care-repository';

import { careQueryKeys } from '../data/query-keys';
import type { CareRepository } from '../domain/repository';
import type { AvailabilitySlot, Clinic, Provider, Specialty } from '../domain/types';

export type ProviderDetailData = {
  clinics: readonly Clinic[];
  provider: Provider;
  slots: readonly AvailabilitySlot[];
  specialties: readonly Specialty[];
};

export type ProviderDetailState =
  | { status: 'error' }
  | { status: 'loading' }
  | { status: 'not-found' }
  | { data: ProviderDetailData; status: 'success' };

export function useProviderDetail(providerId: string, repository?: CareRepository) {
  const resolvedRepository = repository ?? careRepository;
  const providerQuery = useQuery({
    queryKey: careQueryKeys.detail(providerId),
    queryFn: async (): Promise<ProviderDetailData | null> => {
      const provider = await resolvedRepository.getProvider(providerId);

      if (!provider) {
        return null;
      }

      const [allSpecialties, slots, clinicResults] = await Promise.all([
        resolvedRepository.listSpecialties(),
        resolvedRepository.listAvailableSlots(provider.id),
        Promise.all(provider.clinicIds.map((clinicId) => resolvedRepository.getClinic(clinicId))),
      ]);
      const specialtyIds = new Set(provider.specialtyIds);
      const clinics = clinicResults.filter((clinic): clinic is Clinic => clinic !== null);
      const specialties = allSpecialties.filter((specialty) => specialtyIds.has(specialty.id));

      return { clinics, provider, slots, specialties };
    },
  });

  let state: ProviderDetailState;

  if (providerQuery.isPending) {
    state = { status: 'loading' };
  } else if (providerQuery.isError) {
    state = { status: 'error' };
  } else if (providerQuery.data === null) {
    state = { status: 'not-found' };
  } else {
    state = { status: 'success', data: providerQuery.data };
  }

  const retry = useCallback(() => {
    void providerQuery.refetch();
  }, [providerQuery]);

  return { retry, state };
}
