import { useInfiniteQuery, useQueries, useQuery } from '@tanstack/react-query';
import { useCallback, useMemo, useState } from 'react';

import { careRepository } from '@/features/care/data/care-repository';

import { careQueryKeys } from '../data/query-keys';
import { createAvailabilityWindow } from '../domain/availability';
import type { CareRepository, ProviderPageCursor } from '../domain/repository';
import type { AvailabilitySlot, Provider, Specialty } from '../domain/types';

const PROVIDER_PAGE_SIZE = 12;

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
  const [availabilityWindow] = useState(createAvailabilityWindow);
  const search = useMemo(
    () => ({ query, ...(specialtyId ? { specialtyId } : {}) }),
    [query, specialtyId],
  );
  const specialtiesQuery = useQuery({
    queryKey: careQueryKeys.specialties(),
    queryFn: () => repository.listSpecialties(),
  });
  const providersQuery = useInfiniteQuery({
    queryKey: careQueryKeys.discovery(search),
    queryFn: ({ pageParam }) => repository.listProviderPage(search, pageParam, PROVIDER_PAGE_SIZE),
    initialPageParam: null as ProviderPageCursor | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });
  const providers = useMemo(() => {
    const seen = new Set<string>();

    return (
      providersQuery.data?.pages
        .flatMap((page) => page.items)
        .filter((provider) => {
          if (seen.has(provider.id)) {
            return false;
          }

          seen.add(provider.id);
          return true;
        }) ?? []
    );
  }, [providersQuery.data?.pages]);
  const slotQueries = useQueries({
    queries: providers.map((provider) => ({
      queryKey: careQueryKeys.availability(provider.id, availabilityWindow),
      queryFn: () => repository.listAvailableSlots(provider.id, availabilityWindow),
    })),
  });
  const hasSlotError = slotQueries.some((slotQuery) => slotQuery.isError);
  const hasPendingSlot = slotQueries.some((slotQuery) => slotQuery.isPending);
  let state: ProviderDiscoveryState;

  if (providersQuery.isError || specialtiesQuery.isError || hasSlotError) {
    state = { status: 'error' };
  } else if (providersQuery.isPending || specialtiesQuery.isPending || hasPendingSlot) {
    state = { status: 'loading' };
  } else {
    const nextSlots = new Map<string, AvailabilitySlot>();

    for (const [index, slotQuery] of slotQueries.entries()) {
      const provider = providers[index];
      const slot = slotQuery.data?.[0];

      if (provider && slot) {
        nextSlots.set(provider.id, slot);
      }
    }

    state = {
      status: 'success',
      data: {
        nextSlots,
        providers,
        specialties: specialtiesQuery.data,
      },
    };
  }

  const retry = useCallback(() => {
    void providersQuery.refetch();
    void specialtiesQuery.refetch();

    for (const slotQuery of slotQueries) {
      if (slotQuery.isError) {
        void slotQuery.refetch();
      }
    }
  }, [providersQuery, slotQueries, specialtiesQuery]);
  const loadMore = useCallback(() => {
    if (providersQuery.hasNextPage && !providersQuery.isFetching) {
      void providersQuery.fetchNextPage();
    }
  }, [providersQuery]);

  return {
    hasMore: providersQuery.hasNextPage,
    isLoadingMore: providersQuery.isFetchingNextPage,
    loadMore,
    retry,
    state,
  };
}
