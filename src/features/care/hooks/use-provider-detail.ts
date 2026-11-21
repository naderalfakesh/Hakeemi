import { useQuery } from '@tanstack/react-query';
import { useCallback, useState } from 'react';

import { careRepository } from '@/features/care/data/care-repository';
import type { AppDataScope } from '@/services/query/data-scope';

import { careQueryKeys } from '../data/query-keys';
import { createAvailabilityWindow } from '../domain/availability';
import type { CareRepository } from '../domain/repository';
import type { AvailabilitySlot, Clinic, Provider, Specialty } from '../domain/types';

export type ProviderDetailData = {
  availabilityWindow: ReturnType<typeof createAvailabilityWindow>;
  clinics: readonly Clinic[];
  provider: Provider;
  slots: readonly AvailabilitySlot[];
  specialties: readonly Specialty[];
};

export type ProviderDetailSummary = Omit<ProviderDetailData, 'availabilityWindow' | 'slots'>;

export type ProviderDetailState =
  | { status: 'error' }
  | { status: 'loading' }
  | { status: 'not-found' }
  | { data: ProviderDetailData; status: 'success' };

export async function fetchProviderDetailSummary(
  repository: CareRepository,
  providerId: string,
): Promise<ProviderDetailSummary | null> {
  const provider = await repository.getProvider(providerId);

  if (!provider) {
    return null;
  }

  const [allSpecialties, clinicResults] = await Promise.all([
    repository.listSpecialties(),
    Promise.all(provider.clinicIds.map((clinicId) => repository.getClinic(clinicId))),
  ]);
  const specialtyIds = new Set(provider.specialtyIds);
  const clinics = clinicResults.filter((clinic): clinic is Clinic => clinic !== null);
  const specialties = allSpecialties.filter((specialty) => specialtyIds.has(specialty.id));

  return { clinics, provider, specialties };
}

export type ProviderDetailOptions = {
  queryScope?: AppDataScope | undefined;
  repository?: CareRepository | undefined;
};

export function useProviderDetail(
  providerId: string,
  { queryScope = 'account', repository = careRepository }: ProviderDetailOptions = {},
) {
  const [availabilityWindow] = useState(createAvailabilityWindow);
  const providerQuery = useQuery({
    enabled: providerId.length > 0,
    queryKey: careQueryKeys.detail(providerId, queryScope),
    queryFn: () => fetchProviderDetailSummary(repository, providerId),
  });
  const availabilityQuery = useQuery({
    enabled:
      providerId.length > 0 && providerQuery.data !== undefined && providerQuery.data !== null,
    queryKey: careQueryKeys.availability(providerId, availabilityWindow, queryScope),
    queryFn: () => repository.listAvailableSlots(providerId, availabilityWindow),
  });

  let state: ProviderDetailState;

  if (providerQuery.isPending || (providerQuery.data && availabilityQuery.isPending)) {
    state = { status: 'loading' };
  } else if (providerQuery.isError || availabilityQuery.isError) {
    state = { status: 'error' };
  } else if (providerQuery.data === null) {
    state = { status: 'not-found' };
  } else {
    state = {
      status: 'success',
      data: {
        ...providerQuery.data,
        availabilityWindow,
        slots: availabilityQuery.data ?? [],
      },
    };
  }

  const retry = useCallback(() => {
    void providerQuery.refetch();

    if (availabilityQuery.isError) {
      void availabilityQuery.refetch();
    }
  }, [availabilityQuery, providerQuery]);

  return { retry, state };
}
