import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';

import type { AuthUser } from '@/features/auth/domain/types';
import { careRepository } from '@/features/care/data/care-repository';
import { demoCareRepository } from '@/features/care/data/demo-care-repository';
import { demoSavedProvidersRepository } from '@/features/care/data/demo-saved-providers-repository';
import {
  savedProvidersRepository,
  type SavedProvidersRepository,
} from '@/features/care/data/saved-providers-repository';
import type { CareRepository } from '@/features/care/domain/repository';
import type { Provider } from '@/features/care/domain/types';

export const savedProvidersQueryKeys = {
  ids: (ownerKey: string) => ['care', 'saved-providers', ownerKey, 'ids'] as const,
  owner: (ownerKey: string) => ['care', 'saved-providers', ownerKey] as const,
  providers: (ownerKey: string, providerIds: readonly string[]) =>
    ['care', 'saved-providers', ownerKey, 'providers', providerIds] as const,
};

export type SavedProvidersStatus = 'error' | 'loading' | 'ready' | 'saving' | 'unavailable';

export type UseSavedProvidersOptions = {
  careRepository?: Pick<CareRepository, 'getProvider'> | undefined;
  isDemo?: boolean | undefined;
  repository?: SavedProvidersRepository | undefined;
};

type SavedProviderMutationVariables = {
  providerId: string;
  shouldSave: boolean;
};

type SavedProviderMutationContext = {
  previousIds: readonly string[];
};

export function useSavedProviders(user: AuthUser | null, options: UseSavedProvidersOptions = {}) {
  const queryClient = useQueryClient();
  const isDemoSession = Boolean(options.isDemo && !user);
  const ownerKey = user?.id ?? (isDemoSession ? 'demo' : null);
  const activeSavedRepo =
    options.repository ?? (isDemoSession ? demoSavedProvidersRepository : savedProvidersRepository);
  const activeCareRepo =
    options.careRepository ?? (isDemoSession ? demoCareRepository : careRepository);
  const isEnabled = Boolean(ownerKey && activeSavedRepo.available);
  const idsQuery = useQuery({
    enabled: isEnabled,
    queryFn: () => activeSavedRepo.listSavedProviderIds(),
    queryKey: savedProvidersQueryKeys.ids(ownerKey ?? 'guest'),
  });
  const providerIds = useMemo(() => idsQuery.data ?? [], [idsQuery.data]);
  const providersQuery = useQuery({
    enabled: isEnabled && providerIds.length > 0,
    queryFn: async () => {
      const providers = await Promise.all(
        providerIds.map((providerId) => activeCareRepo.getProvider(providerId)),
      );
      return providers.filter((provider): provider is Provider => provider !== null);
    },
    queryKey: savedProvidersQueryKeys.providers(ownerKey ?? 'guest', providerIds),
  });
  const mutation = useMutation<
    void,
    Error,
    SavedProviderMutationVariables,
    SavedProviderMutationContext
  >({
    mutationFn: async ({ providerId, shouldSave }) => {
      if (shouldSave) {
        await activeSavedRepo.saveProvider(providerId);
      } else {
        await activeSavedRepo.removeProvider(providerId);
      }
    },
    onError: (_error, _variables, context) => {
      if (context?.previousIds && ownerKey) {
        queryClient.setQueryData(savedProvidersQueryKeys.ids(ownerKey), context.previousIds);
      }
    },
    onMutate: async ({ providerId, shouldSave }) => {
      if (!ownerKey) {
        return { previousIds: [] };
      }

      const idsKey = savedProvidersQueryKeys.ids(ownerKey);
      await queryClient.cancelQueries({ queryKey: idsKey });
      const previousIds = queryClient.getQueryData<readonly string[]>(idsKey) ?? [];
      const nextIds = shouldSave
        ? [providerId, ...previousIds.filter((id) => id !== providerId)]
        : previousIds.filter((id) => id !== providerId);
      queryClient.setQueryData(idsKey, nextIds);
      return { previousIds };
    },
    onSettled: () => {
      if (ownerKey) {
        void queryClient.invalidateQueries({ queryKey: savedProvidersQueryKeys.ids(ownerKey) });
        void queryClient.invalidateQueries({
          queryKey: ['care', 'saved-providers', ownerKey, 'providers'],
        });
      }
    },
  });

  const toggle = useCallback(
    (providerId: string) => {
      if (!ownerKey || !activeSavedRepo.available) {
        return;
      }

      mutation.mutate({ providerId, shouldSave: !providerIds.includes(providerId) });
    },
    [activeSavedRepo.available, mutation, ownerKey, providerIds],
  );

  const retry = useCallback(() => {
    void idsQuery.refetch();
  }, [idsQuery]);

  const status: SavedProvidersStatus = useMemo(() => {
    if (!ownerKey || !activeSavedRepo.available) {
      return 'unavailable';
    }
    if (mutation.isPending) {
      return 'saving';
    }
    if (idsQuery.isPending || (providerIds.length > 0 && providersQuery.isPending)) {
      return 'loading';
    }
    if (idsQuery.isError || providersQuery.isError) {
      return 'error';
    }
    return 'ready';
  }, [
    activeSavedRepo.available,
    idsQuery,
    mutation.isPending,
    ownerKey,
    providerIds.length,
    providersQuery,
  ]);

  return {
    isSaved: (providerId: string) => providerIds.includes(providerId),
    providers: providersQuery.data ?? [],
    retry,
    status,
    toggle,
  };
}
