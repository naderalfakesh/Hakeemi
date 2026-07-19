import { useCallback, useEffect, useState } from 'react';

import { careRepository } from '@/features/care/data/care-repository';
import type { CareRepository } from '../domain/repository';
import type { AvailabilitySlot, Provider, Specialty } from '../domain/types';

export type ProviderDiscoveryData = {
  nextSlots: ReadonlyMap<string, AvailabilitySlot>;
  providers: readonly Provider[];
  specialties: readonly Specialty[];
};

export type ProviderDiscoveryState =
  { status: 'error' } | { status: 'loading' } | { data: ProviderDiscoveryData; status: 'success' };

type ProviderDiscoveryOptions = {
  query: string;
  repository?: CareRepository;
  specialtyId: string | null;
};

export function useProviderDiscovery({
  query,
  repository = careRepository,
  specialtyId,
}: ProviderDiscoveryOptions) {
  const [requestVersion, setRequestVersion] = useState(0);
  const [state, setState] = useState<ProviderDiscoveryState>({ status: 'loading' });

  useEffect(() => {
    let isCurrent = true;

    async function loadDiscovery() {
      try {
        const [providers, specialties] = await Promise.all([
          repository.listProviders({
            query,
            ...(specialtyId ? { specialtyId } : {}),
          }),
          repository.listSpecialties(),
        ]);
        const slotsByProvider = await Promise.all(
          providers.map(async (provider) => {
            const slots = await repository.listAvailableSlots(provider.id);
            return [provider.id, slots[0]] as const;
          }),
        );

        if (!isCurrent) {
          return;
        }

        const nextSlots = new Map<string, AvailabilitySlot>();
        for (const [providerId, slot] of slotsByProvider) {
          if (slot) {
            nextSlots.set(providerId, slot);
          }
        }

        setState({
          status: 'success',
          data: { nextSlots, providers, specialties },
        });
      } catch {
        if (isCurrent) {
          setState({ status: 'error' });
        }
      }
    }

    void loadDiscovery();

    return () => {
      isCurrent = false;
    };
  }, [query, repository, requestVersion, specialtyId]);

  const retry = useCallback(() => {
    setState({ status: 'loading' });
    setRequestVersion((version) => version + 1);
  }, []);

  return { retry, state };
}
