import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createContext, useCallback, useContext, useMemo, type ReactNode } from 'react';

import { useAuthSession } from '@/features/auth/context/auth-session-provider';

import { readAppPreferences, writeAppPreferences } from '../data/firebase-preferences';
import { readLocalPreferences, writeLocalPreferences } from '../data/local-preferences';
import {
  appPreferencesSchema,
  defaultAppPreferences,
  type AppPreferences,
} from '../domain/preferences';

export type PreferencesStatus = 'error' | 'idle' | 'loading' | 'ready' | 'saving';

type AppPreferencesContextValue = {
  error: string | null;
  preferences: AppPreferences;
  retry: () => void;
  status: PreferencesStatus;
  update: (preferences: AppPreferences) => void;
};

const AppPreferencesContext = createContext<AppPreferencesContextValue | null>(null);

const preferencesQueryKey = (userId: string) => ['account', userId, 'preferences'] as const;

export function AppPreferencesProvider({ children }: { children: ReactNode }) {
  const session = useAuthSession();
  const queryClient = useQueryClient();
  const userId = session.user?.id ?? null;
  const profilePreferences = useMemo(
    () =>
      session.profile
        ? appPreferencesSchema.parse({
            locale: session.profile.locale,
            theme: session.profile.theme,
          })
        : defaultAppPreferences,
    [session.profile],
  );
  const queryKey = preferencesQueryKey(userId ?? 'anonymous');
  const preferencesQuery = useQuery({
    enabled: userId === null || session.profile !== null,
    queryKey,
    // Guests keep their choices on the device; accounts use the synced copy.
    queryFn: async () =>
      userId
        ? ((await readAppPreferences()) ?? profilePreferences)
        : ((await readLocalPreferences()) ?? defaultAppPreferences),
  });
  const preferences = preferencesQuery.data ?? profilePreferences;
  const updateMutation = useMutation({
    mutationFn: (nextPreferences: AppPreferences) =>
      userId ? writeAppPreferences(nextPreferences) : writeLocalPreferences(nextPreferences),
    onMutate: async (nextPreferences) => {
      await queryClient.cancelQueries({ queryKey });
      const previousPreferences = queryClient.getQueryData<AppPreferences>(queryKey);
      queryClient.setQueryData(queryKey, nextPreferences);
      return { previousPreferences };
    },
    onError: (_error, _nextPreferences, context) => {
      queryClient.setQueryData(queryKey, context?.previousPreferences ?? profilePreferences);
    },
    onSuccess: (_data, nextPreferences) => {
      queryClient.setQueryData(queryKey, nextPreferences);
    },
  });

  let status: PreferencesStatus;
  let error: string | null = null;

  if (updateMutation.isPending) {
    status = 'saving';
  } else if (updateMutation.isError) {
    status = 'error';
    error = 'Your preference could not be saved. Your previous choice was restored.';
  } else if (preferencesQuery.isError) {
    status = 'error';
    error = 'Your synced preferences could not be loaded.';
  } else if ((userId !== null && !session.profile) || preferencesQuery.isPending) {
    status = 'loading';
  } else {
    status = 'ready';
  }

  const retry = useCallback(() => {
    updateMutation.reset();
    void preferencesQuery.refetch();
  }, [preferencesQuery, updateMutation]);
  const update = useCallback(
    (nextPreferences: AppPreferences) => {
      updateMutation.mutate(appPreferencesSchema.parse(nextPreferences));
    },
    [updateMutation],
  );
  const value = useMemo<AppPreferencesContextValue>(
    () => ({ error, preferences, retry, status, update }),
    [error, preferences, retry, status, update],
  );

  return <AppPreferencesContext.Provider value={value}>{children}</AppPreferencesContext.Provider>;
}

export function useAppPreferences() {
  const context = useContext(AppPreferencesContext);

  if (!context) {
    throw new Error('useAppPreferences must be used inside AppPreferencesProvider.');
  }

  return context;
}
