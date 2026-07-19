import { useCallback, useMemo, useState } from 'react';
import { FlatList, StyleSheet, View, type ListRenderItem } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText, Button, DecorativeIcon, EmptyState, Skeleton, TextField } from '@/components/ui';
import { useAppTheme, type AppTheme } from '@/theme';

import { ProviderCard } from '../components/provider-card';
import { ProviderCardSkeleton } from '../components/provider-card-skeleton';
import { SpecialtyFilter } from '../components/specialty-filter';
import type { CareRepository } from '../domain/repository';
import type { Provider } from '../domain/types';
import { useProviderDiscovery } from '../hooks/use-provider-discovery';

type FindCareScreenProps = {
  onSelectProvider: (providerId: string) => void;
  repository?: CareRepository;
};

export function FindCareScreen({ onSelectProvider, repository }: FindCareScreenProps) {
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [query, setQuery] = useState('');
  const [specialtyId, setSpecialtyId] = useState<string | null>(null);
  const { hasMore, isLoadingMore, loadMore, retry, state } = useProviderDiscovery({
    query,
    specialtyId,
    ...(repository ? { repository } : {}),
  });
  const data = state.status === 'success' ? state.data : null;
  const specialtyNames = useMemo(
    () => new Map(data?.specialties.map((specialty) => [specialty.id, specialty.name.en]) ?? []),
    [data?.specialties],
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
        specialtyName={specialtyNames.get(item.specialtyIds[0] ?? '') ?? 'Clinician'}
      />
    ),
    [data?.nextSlots, onSelectProvider, specialtyNames],
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
                Find care
              </AppText>
              <AppText tone="secondary" variant="bodyLarge">
                Search by clinician, specialty, or language.
              </AppText>
            </View>
            <TextField
              accessibilityLabel="Search clinicians"
              autoCapitalize="none"
              label="Search"
              onChangeText={setQuery}
              placeholder="Try cardiology or Arabic"
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
            {data && data.providers.length > 0 && (
              <AppText tone="secondary" variant="caption">
                {data.providers.length} {data.providers.length === 1 ? 'clinician' : 'clinicians'}
              </AppText>
            )}
          </View>
        }
        ListFooterComponent={
          data && data.providers.length > 0 && (hasMore || isLoadingMore) ? (
            <View style={styles.pagination}>
              <Button busy={isLoadingMore} onPress={loadMore} variant="secondary">
                {isLoadingMore ? 'Loading more clinicians' : 'Load more clinicians'}
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
  const styles = useMemo(() => createStyles(theme), [theme]);

  if (status === 'loading') {
    return (
      <View accessibilityLabel="Loading clinicians" style={styles.loadingCards}>
        <ProviderCardSkeleton />
        <ProviderCardSkeleton />
        <ProviderCardSkeleton />
      </View>
    );
  }

  if (status === 'error') {
    return (
      <EmptyState
        action={<Button onPress={onRetry}>Try again</Button>}
        description="Check your connection and retry. Your search has not been lost."
        icon={<DecorativeIcon color={theme.colors.danger} name="cloud-offline-outline" size={32} />}
        title="Clinicians could not be loaded"
      />
    );
  }

  return (
    <EmptyState
      action={
        hasFilters ? (
          <Button onPress={onClear} variant="secondary">
            Clear search and filters
          </Button>
        ) : undefined
      }
      description="Try another name, specialty, or language."
      icon={<DecorativeIcon color={theme.colors.brand} name="search-outline" size={32} />}
      title="No clinicians match"
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
