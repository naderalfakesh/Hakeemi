import { useCallback, useEffect, useState } from 'react';

import { careRepository } from '../data/fixture-care-repository';
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
  const [requestVersion, setRequestVersion] = useState(0);
  const [state, setState] = useState<ProviderDetailState>({ status: 'loading' });

  useEffect(() => {
    let isCurrent = true;

    async function loadProviderDetail() {
      try {
        const provider = await resolvedRepository.getProvider(providerId);
        if (!isCurrent) {
          return;
        }
        if (!provider) {
          setState({ status: 'not-found' });
          return;
        }

        const [allSpecialties, slots, clinicResults] = await Promise.all([
          resolvedRepository.listSpecialties(),
          resolvedRepository.listAvailableSlots(provider.id),
          Promise.all(provider.clinicIds.map((clinicId) => resolvedRepository.getClinic(clinicId))),
        ]);

        if (!isCurrent) {
          return;
        }

        const specialtyIds = new Set(provider.specialtyIds);
        const clinics = clinicResults.filter((clinic): clinic is Clinic => clinic !== null);
        const specialties = allSpecialties.filter((specialty) => specialtyIds.has(specialty.id));

        setState({
          status: 'success',
          data: { clinics, provider, slots, specialties },
        });
      } catch {
        if (isCurrent) {
          setState({ status: 'error' });
        }
      }
    }

    void loadProviderDetail();

    return () => {
      isCurrent = false;
    };
  }, [providerId, requestVersion, resolvedRepository]);

  const retry = useCallback(() => {
    setState({ status: 'loading' });
    setRequestVersion((version) => version + 1);
  }, []);

  return { retry, state };
}
