import { useCallback, useMemo, useState } from 'react';
import { FlatList, StyleSheet, View, type ListRenderItem } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  AppText,
  Button,
  DecorativeIcon,
  EmptyState,
  Skeleton,
  StaleDataNotice,
  TextField,
} from '@/components/ui';
import { formatLocalizedCount } from '@/localization/format';
import { useAppLocale } from '@/localization/locale-provider';
import { useStrings } from '@/localization/use-strings';
import { useIsOffline } from '@/services/connectivity/use-is-offline';
import { useAppTheme, type AppTheme } from '@/theme';

import { ProviderCard } from '../components/provider-card';
import { ProviderCardSkeleton } from '../components/provider-card-skeleton';
import { SpecialtyFilter } from '../components/specialty-filter';
import type { CareRepository } from '../domain/repository';
import type { Provider } from '../domain/types';
import { useProviderDiscovery } from '../hooks/use-provider-discovery';
import { clinicianCountLabels, findCareStrings } from '../localization/care-strings';

type FindCareScreenProps = {
  onSelectProvider: (providerId: string) => void;
  repository?: CareRepository;
};

export function FindCareScreen({ onSelectProvider, repository }: FindCareScreenProps) {
  const theme = useAppTheme();
  const { locale } = useAppLocale();
  const strings = useStrings(findCareStrings);
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [query, setQuery] = useState('');
  const [specialtyId, setSpecialtyId] = useState<string | null>(null);
  const { hasMore, isLoadingMore, isRefreshFailed, lastUpdatedAt, loadMore, retry, state } =
    useProviderDiscovery({
      query,
      specialtyId,
      ...(repository ? { repository } : {}),
    });
  const isOffline = useIsOffline();
  const data = state.status === 'success' ? state.data : null;
  const staleReason = isOffline ? 'offline' : isRefreshFailed ? 'refresh-failed' : null;
  const specialtyNames = useMemo(
    () =>
      new Map(
        data?.specialties.map((specialty) => [specialty.id, specialty.name[locale]] as const) ?? [],
      ),
    [data?.specialties, locale],
  );
  const clearFilters = useCallback(() => {
    setQuery('');
    setSpecialtyId(null);
  }, []);
  const renderProvider = useCallback<ListRenderItem<Provider>>(
    ({ item }) => (
      <ProviderCard
        nextSlot={data?.nextSlots.get(item.id) ?? null}
        onPress={onSelectProvider}
        provider={item}
        specialtyName={specialtyNames.get(item.specialtyIds[0] ?? '') ?? strings.clinicianFallback}
      />
    ),
    [data?.nextSlots, onSelectProvider, specialtyNames, strings],
  );

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <FlatList
        ListEmptyComponent={
          <ResultsState
            hasFilters={Boolean(query || specialtyId)}
            onClear={clearFilters}
            onRetry={retry}
            status={state.status}
          />
        }
        ListHeaderComponent={
          <View style={styles.header}>
            <View style={styles.heading}>
              <AppText accessibilityRole="header" variant="display">
                {strings.title}
              </AppText>
              <AppText tone="secondary" variant="bodyLarge">
                {strings.subtitle}
              </AppText>
            </View>
            <TextField
              accessibilityLabel={strings.searchAccessibilityLabel}
              autoCapitalize="none"
              label={strings.searchLabel}
              onChangeText={setQuery}
              placeholder={strings.searchPlaceholder}
              returnKeyType="search"
              value={query}
            />
            {data ? (
              <SpecialtyFilter
                onChange={setSpecialtyId}
                selectedId={specialtyId}
                specialties={data.specialties}
              />
            ) : (
              <View style={styles.loadingFilters}>
                <Skeleton height={44} width={72} />
                <Skeleton height={44} width={132} />
                <Skeleton height={44} width={104} />
              </View>
            )}
            {data && staleReason && (
              <StaleDataNotice reason={staleReason} updatedAt={lastUpdatedAt} />
            )}
            {data && data.providers.length > 0 && (
              <AppText tone="secondary" variant="caption">
                {formatLocalizedCount(data.providers.length, locale, clinicianCountLabels)}
              </AppText>
            )}
          </View>
        }
        ListFooterComponent={
          data && data.providers.length > 0 && (hasMore || isLoadingMore) ? (
            <View style={styles.pagination}>
              <Button busy={isLoadingMore} onPress={loadMore} variant="secondary">
                {isLoadingMore ? strings.loadingMoreClinicians : strings.loadMoreClinicians}
              </Button>
            </View>
          ) : null
        }
        contentContainerStyle={styles.content}
        data={data?.providers ?? []}
        initialNumToRender={6}
        ItemSeparatorComponent={ResultSeparator}
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
        keyExtractor={providerKeyExtractor}
        maxToRenderPerBatch={6}
        onEndReached={hasMore && !isLoadingMore ? loadMore : undefined}
        onEndReachedThreshold={0.35}
        renderItem={renderProvider}
        showsVerticalScrollIndicator={false}
        windowSize={5}
      />
    </SafeAreaView>
  );
}

type ResultsStateProps = {
  hasFilters: boolean;
  onClear: () => void;
  onRetry: () => void;
  status: 'error' | 'loading' | 'success';
};

function ResultsState({ hasFilters, onClear, onRetry, status }: ResultsStateProps) {
  const theme = useAppTheme();
  const strings = useStrings(findCareStrings);
  const styles = useMemo(() => createStyles(theme), [theme]);

  if (status === 'loading') {
    return (
      <View accessibilityLabel={strings.loadingClinicians} style={styles.loadingCards}>
        <ProviderCardSkeleton />
        <ProviderCardSkeleton />
        <ProviderCardSkeleton />
      </View>
    );
  }

  if (status === 'error') {
    return (
      <EmptyState
        action={<Button onPress={onRetry}>{strings.tryAgain}</Button>}
        description={strings.errorDescription}
        icon={<DecorativeIcon color={theme.colors.danger} name="cloud-offline-outline" size={32} />}
        title={strings.errorTitle}
      />
    );
  }

  return (
    <EmptyState
      action={
        hasFilters ? (
          <Button onPress={onClear} variant="secondary">
            {strings.clearFilters}
          </Button>
        ) : undefined
      }
      description={strings.emptyDescription}
      icon={<DecorativeIcon color={theme.colors.brand} name="search-outline" size={32} />}
      title={strings.emptyTitle}
    />
  );
}

function ResultSeparator() {
  return <View style={separatorStyles.result} />;
}

function providerKeyExtractor(provider: Provider) {
  return provider.id;
}

const separatorStyles = StyleSheet.create({
  result: {
    height: 12,
  },
});

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
    header: {
      gap: theme.spacing.lg,
      paddingBottom: theme.spacing.md,
      paddingTop: theme.spacing.lg,
    },
    heading: {
      gap: theme.spacing.xxs,
    },
    loadingFilters: {
      flexDirection: 'row',
      gap: theme.spacing.xs,
      overflow: 'hidden',
    },
    loadingCards: {
      gap: theme.spacing.sm,
    },
    pagination: {
      paddingTop: theme.spacing.lg,
    },
  });
}
