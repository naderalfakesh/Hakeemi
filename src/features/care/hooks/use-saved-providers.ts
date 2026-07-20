import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';

import { careRepository } from '@/features/care/data/care-repository';
import { savedProvidersRepository } from '@/features/care/data/saved-providers-repository';
import type { Provider } from '@/features/care/domain/types';
import type { AuthUser } from '@/features/auth/domain/types';

const savedProvidersQueryKeys = {
  ids: (userId: string) => ['care', 'saved-providers', userId, 'ids'] as const,
  providers: (userId: string, providerIds: readonly string[]) =>
    ['care', 'saved-providers', userId, 'providers', providerIds] as const,
};

export type SavedProvidersStatus = 'error' | 'loading' | 'ready' | 'saving' | 'unavailable';

type SavedProviderMutationVariables = {
  providerId: string;
  shouldSave: boolean;
};

type SavedProviderMutationContext = {
  previousIds: readonly string[];
};

export function useSavedProviders(user: AuthUser | null) {
  const queryClient = useQueryClient();
  const userId = user?.id ?? null;
  const isEnabled = Boolean(userId && savedProvidersRepository.available);
  const idsQuery = useQuery({
    enabled: isEnabled,
    queryFn: () => savedProvidersRepository.listSavedProviderIds(),
    queryKey: savedProvidersQueryKeys.ids(userId ?? 'guest'),
  });
  const providerIds = useMemo(() => idsQuery.data ?? [], [idsQuery.data]);
  const providersQuery = useQuery({
    enabled: isEnabled && providerIds.length > 0,
    queryFn: async () => {
      const providers = await Promise.all(
        providerIds.map((providerId) => careRepository.getProvider(providerId)),
      );
      return providers.filter((provider): provider is Provider => provider !== null);
    },
    queryKey: savedProvidersQueryKeys.providers(userId ?? 'guest', providerIds),
  });
  const mutation = useMutation<
    void,
    Error,
    SavedProviderMutationVariables,
    SavedProviderMutationContext
  >({
    mutationFn: async ({ providerId, shouldSave }) => {
      if (shouldSave) {
        await savedProvidersRepository.saveProvider(providerId);
      } else {
        await savedProvidersRepository.removeProvider(providerId);
      }
    },
    onError: (_error, _variables, context) => {
      if (context?.previousIds && userId) {
        queryClient.setQueryData(savedProvidersQueryKeys.ids(userId), context.previousIds);
      }
    },
    onMutate: async ({ providerId, shouldSave }) => {
      if (!userId) {
        return { previousIds: [] };
      }

      const idsKey = savedProvidersQueryKeys.ids(userId);
      await queryClient.cancelQueries({ queryKey: idsKey });
      const previousIds = queryClient.getQueryData<readonly string[]>(idsKey) ?? [];
      const nextIds = shouldSave
        ? [providerId, ...previousIds.filter((id) => id !== providerId)]
        : previousIds.filter((id) => id !== providerId);
      queryClient.setQueryData(idsKey, nextIds);
      return { previousIds };
    },
    onSettled: () => {
      if (userId) {
        void queryClient.invalidateQueries({ queryKey: savedProvidersQueryKeys.ids(userId) });
        void queryClient.invalidateQueries({
          queryKey: ['care', 'saved-providers', userId, 'providers'],
        });
      }
    },
  });

  const toggle = useCallback(
    (providerId: string) => {
      if (!userId || !savedProvidersRepository.available) {
        return;
      }

      mutation.mutate({ providerId, shouldSave: !providerIds.includes(providerId) });
    },
    [mutation, providerIds, userId],
  );

  const retry = useCallback(() => {
    void idsQuery.refetch();
  }, [idsQuery]);

  const status: SavedProvidersStatus = useMemo(() => {
    if (!userId || !savedProvidersRepository.available) {
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
  }, [idsQuery, mutation.isPending, providerIds.length, providersQuery, userId]);

  return {
    isSaved: (providerId: string) => providerIds.includes(providerId),
    providers: providersQuery.data ?? [],
    retry,
    status,
    toggle,
  };
}
