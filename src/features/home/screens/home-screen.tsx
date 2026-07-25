import { useCallback, useMemo } from 'react';
import { FlatList, StyleSheet, View, type ListRenderItem } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  AppText,
  Button,
  DecorativeIcon,
  EmptyState,
  InlineError,
  stateIllustrations,
  Surface,
} from '@/components/ui';
import { ProviderCard } from '@/features/care/components/provider-card';
import { ProviderCardSkeleton } from '@/features/care/components/provider-card-skeleton';
import type { CareRepository } from '@/features/care/domain/repository';
import type { CareQueryScope } from '@/features/care/data/query-keys';
import type { Provider } from '@/features/care/domain/types';
import { useProviderDiscovery } from '@/features/care/hooks/use-provider-discovery';
import { homeStrings } from '@/features/home/localization/home-strings';
import { useAppLocale } from '@/localization/locale-provider';
import { useStrings } from '@/localization/use-strings';
import { useAppTheme, type AppTheme } from '@/theme';

type HomeScreenProps = {
  onFindCare: () => void;
  onOpenCatalogue?: () => void;
  onSelectProvider: (providerId: string) => void;
  queryScope?: CareQueryScope;
  repository?: CareRepository;
};

export function HomeScreen({
  onFindCare,
  onOpenCatalogue,
  onSelectProvider,
  queryScope = 'account',
  repository,
}: HomeScreenProps) {
  const theme = useAppTheme();
  const { locale } = useAppLocale();
  const strings = useStrings(homeStrings);
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { retry, state } = useProviderDiscovery({
    queryScope,
    query: '',
    specialtyId: null,
    ...(repository ? { repository } : {}),
  });
  const discovery = state.status === 'success' ? state.data : null;
  const providers =
    discovery?.providers.filter((provider) => provider.isFeatured).slice(0, 3) ?? [];
  const specialtyNames = useMemo(
    () =>
      new Map(
        discovery?.specialties.map(
          (specialty) => [specialty.id, specialty.name[locale]] as const,
        ) ?? [],
      ),
    [discovery?.specialties, locale],
  );
  const renderProvider = useCallback<ListRenderItem<Provider>>(
    ({ item }) => (
      <ProviderCard
        nextSlot={discovery?.nextSlots.get(item.id) ?? null}
        onPress={onSelectProvider}
        provider={item}
        specialtyName={specialtyNames.get(item.specialtyIds[0] ?? '') ?? strings.clinicianFallback}
      />
    ),
    [discovery?.nextSlots, onSelectProvider, specialtyNames, strings],
  );

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <FlatList
        ListEmptyComponent={
          <HomeResultsState onFindCare={onFindCare} onRetry={retry} status={state.status} />
        }
        ListFooterComponent={
          <View style={styles.footer}>
            <View style={styles.note}>
              <DecorativeIcon
                color={theme.colors.textSecondary}
                name="information-circle"
                size={20}
              />
              <AppText tone="secondary" variant="caption">
                {strings.fictionalDataNote}
              </AppText>
            </View>
            {onOpenCatalogue && (
              <Button onPress={onOpenCatalogue} variant="tertiary">
                {strings.openCatalogue}
              </Button>
            )}
          </View>
        }
        ListHeaderComponent={<HomeHeader onFindCare={onFindCare} />}
        contentContainerStyle={styles.content}
        data={providers}
        initialNumToRender={3}
        ItemSeparatorComponent={ProviderSeparator}
        keyExtractor={providerKeyExtractor}
        renderItem={renderProvider}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

function HomeHeader({ onFindCare }: { onFindCare: () => void }) {
  const theme = useAppTheme();
  const strings = useStrings(homeStrings);
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <View style={styles.header}>
      <View style={styles.heading}>
        <AppText tone="secondary" variant="labelLarge">
          {strings.portfolioDemo}
        </AppText>
        <AppText accessibilityRole="header" variant="display">
          {strings.greeting}
        </AppText>
      </View>

      <Surface padding="spacious" variant="brand">
        <View style={styles.featureIcon}>
          <DecorativeIcon color={theme.colors.brand} name="search" size={26} />
        </View>
        <AppText style={styles.featureTitle} variant="titleMedium">
          {strings.featureTitle}
        </AppText>
        <AppText style={styles.featureDescription} tone="secondary" variant="bodyLarge">
          {strings.featureDescription}
        </AppText>
        <Button onPress={onFindCare}>{strings.findCare}</Button>
      </Surface>

      <View style={styles.sectionHeading}>
        <View>
          <AppText variant="titleMedium">{strings.availableSoon}</AppText>
          <AppText tone="secondary" variant="bodyMedium">
            {strings.featuredClinicians}
          </AppText>
        </View>
        <Button onPress={onFindCare} variant="tertiary">
          {strings.seeAll}
        </Button>
      </View>
    </View>
  );
}

function HomeResultsState({
  onFindCare,
  onRetry,
  status,
}: {
  onFindCare: () => void;
  onRetry: () => void;
  status: 'error' | 'loading' | 'success';
}) {
  const theme = useAppTheme();
  const strings = useStrings(homeStrings);
  const styles = useMemo(() => createStyles(theme), [theme]);

  if (status === 'loading') {
    return (
      <View accessibilityLabel={strings.loadingFeatured} style={styles.loadingCards}>
        <ProviderCardSkeleton />
        <ProviderCardSkeleton />
      </View>
    );
  }

  if (status === 'error') {
    return (
      <Surface style={styles.errorSurface} variant="plain">
        <InlineError message={strings.errorMessage} />
        <Button onPress={onRetry} variant="secondary">
          {strings.tryAgain}
        </Button>
      </Surface>
    );
  }

  return (
    <EmptyState
      action={
        <Button onPress={onFindCare} variant="secondary">
          {strings.browseAllClinicians}
        </Button>
      }
      description={strings.emptyDescription}
      illustration={stateIllustrations.noResults}
      title={strings.emptyTitle}
    />
  );
}

function ProviderSeparator() {
  return <View style={separatorStyles.provider} />;
}

function providerKeyExtractor(provider: Provider) {
  return provider.id;
}

const separatorStyles = StyleSheet.create({
  provider: {
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
      gap: theme.spacing.xl,
      paddingBottom: theme.spacing.md,
      paddingTop: theme.spacing.lg,
    },
    heading: {
      gap: theme.spacing.xxs,
    },
    featureIcon: {
      alignItems: 'center',
      backgroundColor: theme.colors.surfaceRaised,
      borderRadius: theme.radii.md,
      height: 52,
      justifyContent: 'center',
      width: 52,
    },
    featureTitle: {
      marginTop: theme.spacing.lg,
    },
    featureDescription: {
      marginBottom: theme.spacing.lg,
      marginTop: theme.spacing.xs,
    },
    sectionHeading: {
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    loadingCards: {
      gap: theme.spacing.sm,
    },
    errorSurface: {
      gap: theme.spacing.md,
    },
    footer: {
      gap: theme.spacing.lg,
      paddingTop: theme.spacing.xl,
    },
    note: {
      alignItems: 'flex-start',
      flexDirection: 'row',
      gap: theme.spacing.xs,
      paddingHorizontal: theme.spacing.xs,
    },
  });
}
