import { keepPreviousData, useInfiniteQuery, useQueries, useQuery } from '@tanstack/react-query';
import { useCallback, useMemo, useState } from 'react';

import { careRepository } from '@/features/care/data/care-repository';

import { careQueryKeys, type CareQueryScope } from '../data/query-keys';
import { createAvailabilityWindow } from '../domain/availability';
import type { CareRepository, ProviderPageCursor } from '../domain/repository';
import type { AvailabilitySlot, Provider, Specialty } from '../domain/types';

const PROVIDER_PAGE_SIZE = 12;

export type ProviderDiscoveryData = {
  nextSlots: ReadonlyMap<string, AvailabilitySlot>;
  /** Providers whose availability is still loading; their cards show a placeholder. */
  pendingSlotProviderIds: ReadonlySet<string>;
  providers: readonly Provider[];
  specialties: readonly Specialty[];
};

export type ProviderDiscoveryState =
  { status: 'error' } | { status: 'loading' } | { data: ProviderDiscoveryData; status: 'success' };

type ProviderDiscoveryOptions = {
  queryScope?: CareQueryScope;
  query: string;
  repository?: CareRepository;
  specialtyId: string | null;
};

export function useProviderDiscovery({
  queryScope = 'account',
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
    queryKey: careQueryKeys.specialties(queryScope),
    queryFn: () => repository.listSpecialties(),
  });
  const providersQuery = useInfiniteQuery({
    queryKey: careQueryKeys.discovery(search, queryScope),
    queryFn: ({ pageParam }) => repository.listProviderPage(search, pageParam, PROVIDER_PAGE_SIZE),
    initialPageParam: null as ProviderPageCursor | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    // A new search keeps the current results on screen until its first page arrives.
    placeholderData: keepPreviousData,
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
      queryKey: careQueryKeys.availability(provider.id, availabilityWindow, queryScope),
      queryFn: () => repository.listAvailableSlots(provider.id, availabilityWindow),
    })),
  });
  const hasSlotError = slotQueries.some((slotQuery) => slotQuery.isError);
  const isMissingData =
    (providersQuery.isError && providersQuery.data === undefined) ||
    (specialtiesQuery.isError && specialtiesQuery.data === undefined) ||
    slotQueries.some((slotQuery) => slotQuery.isError && slotQuery.data === undefined);
  const isRefreshFailed =
    !isMissingData && (providersQuery.isError || specialtiesQuery.isError || hasSlotError);
  let state: ProviderDiscoveryState;

  if (isMissingData) {
    state = { status: 'error' };
  } else if (providersQuery.isPending || specialtiesQuery.isPending) {
    // Only the first load blocks the list. Later pages and availability load
    // in place, so "load more" never replaces the results with skeletons.
    state = { status: 'loading' };
  } else {
    const nextSlots = new Map<string, AvailabilitySlot>();
    const pendingSlotProviderIds = new Set<string>();

    for (const [index, slotQuery] of slotQueries.entries()) {
      const provider = providers[index];
      const slot = slotQuery.data?.[0];

      if (provider && slot) {
        nextSlots.set(provider.id, slot);
      } else if (provider && slotQuery.isPending) {
        pendingSlotProviderIds.add(provider.id);
      }
    }

    state = {
      status: 'success',
      data: {
        nextSlots,
        pendingSlotProviderIds,
        providers,
        specialties: specialtiesQuery.data ?? [],
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
    isSearching: providersQuery.isPlaceholderData,
    isLoadingMore: providersQuery.isFetchingNextPage,
    isRefreshFailed,
    lastUpdatedAt: providersQuery.dataUpdatedAt || null,
    loadMore,
    retry,
    state,
  };
}
