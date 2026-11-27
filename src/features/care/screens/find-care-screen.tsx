import { useCallback, useMemo, useState } from 'react';
import { FlatList, StyleSheet, View, type ListRenderItem } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/ui';
import { usePullToRefresh } from '@/hooks/use-pull-to-refresh';
import { useAppLocale } from '@/localization/locale-provider';
import { useStrings } from '@/localization/use-strings';
import { useIsOffline } from '@/services/connectivity/use-is-offline';
import type { AppDataScope } from '@/services/query/data-scope';
import { useThemedStyles, type AppTheme } from '@/theme';

import { FindCareHeader } from '../components/find-care-header';
import { FindCareResultsState } from '../components/find-care-results-state';
import { ProviderCard } from '../components/provider-card';
import { ProviderListSeparator, providerKeyExtractor } from '../components/provider-list';
import type { CareRepository } from '../domain/repository';
import type { Provider } from '../domain/types';
import { useDebouncedValue } from '../hooks/use-debounced-value';
import { useProviderDiscovery } from '../hooks/use-provider-discovery';
import { findCareStrings } from '../localization/care-strings';
import { buildSpecialtyNameMap } from '../presentation/formatters';

const SEARCH_DEBOUNCE_MS = 300;

type FindCareScreenProps = {
  initialSpecialtyId?: string | null | undefined;
  onSelectProvider: (providerId: string) => void;
  queryScope?: AppDataScope;
  repository?: CareRepository;
};

export function FindCareScreen({
  initialSpecialtyId,
  onSelectProvider,
  queryScope = 'account',
  repository,
}: FindCareScreenProps) {
  const { locale } = useAppLocale();
  const strings = useStrings(findCareStrings);
  const styles = useThemedStyles(createStyles);
  const [query, setQuery] = useState('');
  const [specialtyId, setSpecialtyId] = useState<string | null>(initialSpecialtyId ?? null);
  const [prevInitialSpecialtyId, setPrevInitialSpecialtyId] = useState(initialSpecialtyId);

  if (initialSpecialtyId !== prevInitialSpecialtyId) {
    setPrevInitialSpecialtyId(initialSpecialtyId);
    if (initialSpecialtyId !== undefined) {
      setSpecialtyId(initialSpecialtyId);
    }
  }

  // Typing settles before a new query runs; clearing the field applies at once.
  const debouncedQuery = useDebouncedValue(query.trim(), SEARCH_DEBOUNCE_MS);
  const searchQuery = query.trim() === '' ? '' : debouncedQuery;
  const {
    hasMore,
    isLoadingMore,
    isRefreshFailed,
    isSearching,
    lastUpdatedAt,
    loadMore,
    refresh,
    retry,
    state,
  } = useProviderDiscovery({
    queryScope,
    query: searchQuery,
    specialtyId,
    ...(repository ? { repository } : {}),
  });
  const { handleRefresh, isRefreshing } = usePullToRefresh(refresh);
  const isUpdatingSearch = isSearching || query.trim() !== searchQuery;
  const isOffline = useIsOffline();
  const data = state.status === 'success' ? state.data : null;
  const staleReason = isOffline ? 'offline' : isRefreshFailed ? 'refresh-failed' : null;
  const specialtyNames = useMemo(
    () => buildSpecialtyNameMap(data?.specialties, locale),
    [data?.specialties, locale],
  );
  const clearFilters = useCallback(() => {
    setQuery('');
    setSpecialtyId(null);
  }, []);
  const renderProvider = useCallback<ListRenderItem<Provider>>(
    ({ item }) => (
      <ProviderCard
        isSlotLoading={data?.pendingSlotProviderIds.has(item.id) ?? false}
        nextSlot={data?.nextSlots.get(item.id) ?? null}
        onPress={onSelectProvider}
        provider={item}
        specialtyName={specialtyNames.get(item.specialtyIds[0] ?? '') ?? strings.clinicianFallback}
      />
    ),
    [data?.nextSlots, data?.pendingSlotProviderIds, onSelectProvider, specialtyNames, strings],
  );

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <FlatList
        ListEmptyComponent={
          <FindCareResultsState
            hasFilters={Boolean(query || specialtyId)}
            onClear={clearFilters}
            onRetry={retry}
            status={state.status}
          />
        }
        ListHeaderComponent={
          <FindCareHeader
            isUpdatingSearch={isUpdatingSearch}
            lastUpdatedAt={lastUpdatedAt}
            onQueryChange={setQuery}
            onSpecialtyChange={setSpecialtyId}
            providerCount={data ? data.providers.length : null}
            query={query}
            selectedSpecialtyId={specialtyId}
            specialties={data?.specialties ?? null}
            staleReason={staleReason}
          />
        }
        ListFooterComponent={
          data && data.providers.length > 0 && (hasMore || isLoadingMore) ? (
            <View style={styles.pagination}>
              <Button busy={isLoadingMore} onPress={loadMore} variant="secondary">
                {isLoadingMore ? strings.loadingMoreClinicians : strings.loadMoreClinicians}
              </Button>
            </View>
          ) : undefined
        }
        contentContainerStyle={styles.content}
        data={data?.providers ?? []}
        initialNumToRender={6}
        ItemSeparatorComponent={ProviderListSeparator}
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
        keyExtractor={providerKeyExtractor}
        maxToRenderPerBatch={6}
        onEndReached={hasMore && !isLoadingMore ? loadMore : undefined}
        onEndReachedThreshold={0.35}
        onRefresh={() => void handleRefresh()}
        refreshing={isRefreshing}
        renderItem={renderProvider}
        showsVerticalScrollIndicator={false}
        windowSize={5}
      />
    </SafeAreaView>
  );
}

function createStyles(theme: AppTheme) {
  return StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: theme.colors.canvas,
    },
    content: {
      alignSelf: 'center',
      flexGrow: 1,
      maxWidth: theme.sizes.contentMaxWidth,
      paddingBottom: theme.spacing.xxxl,
      paddingHorizontal: theme.spacing.lg,
      width: '100%',
    },
    pagination: {
      paddingTop: theme.spacing.lg,
    },
  });
}
