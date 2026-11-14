import { useCallback, useMemo, useState } from 'react';
import {
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  type ListRenderItem,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  AppText,
  Button,
  Chip,
  DecorativeIcon,
  EmptyState,
  InlineError,
  stateIllustrations,
  Surface,
} from '@/components/ui';
import { NextVisitCard } from '@/features/appointments/components/next-visit-card';
import type { Appointment } from '@/features/appointments/domain/types';
import { ProviderCard } from '@/features/care/components/provider-card';
import { ProviderCardSkeleton } from '@/features/care/components/provider-card-skeleton';
import type { CareRepository } from '@/features/care/domain/repository';
import type { CareQueryScope } from '@/features/care/data/query-keys';
import type { Provider, Specialty } from '@/features/care/domain/types';
import { useProviderDiscovery } from '@/features/care/hooks/use-provider-discovery';
import { homeStrings } from '@/features/home/localization/home-strings';
import { useAppLocale } from '@/localization/locale-provider';
import { useStrings } from '@/localization/use-strings';
import { useAppTheme, type AppTheme } from '@/theme';

export type HomeNextVisit = {
  appointment: Appointment;
  providerName: string;
};

type HomeScreenProps = {
  /** Shows the demo badge so fictional data is never mistaken for an account. */
  isDemo?: boolean;
  nextVisit?: HomeNextVisit | null;
  onFindCare: () => void;
  onOpenAppointment?: (appointmentId: string) => void;
  onOpenCatalogue?: () => void;
  onSelectProvider: (providerId: string) => void;
  onSelectSpecialty?: ((specialtyId: string) => void) | undefined;
  queryScope?: CareQueryScope;
  repository?: CareRepository;
};

export function HomeScreen({
  isDemo = false,
  nextVisit = null,
  onFindCare,
  onOpenAppointment,
  onOpenCatalogue,
  onSelectProvider,
  onSelectSpecialty,
  queryScope = 'account',
  repository,
}: HomeScreenProps) {
  const theme = useAppTheme();
  const { locale } = useAppLocale();
  const strings = useStrings(homeStrings);
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { refresh, retry, state } = useProviderDiscovery({
    featuredOnly: true,
    queryScope,
    query: '',
    specialtyId: null,
    ...(repository ? { repository } : {}),
  });
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await refresh();
    } finally {
      setIsRefreshing(false);
    }
  }, [refresh]);
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
        isSlotLoading={discovery?.pendingSlotProviderIds.has(item.id) ?? false}
        nextSlot={discovery?.nextSlots.get(item.id) ?? null}
        onPress={onSelectProvider}
        provider={item}
        specialtyName={specialtyNames.get(item.specialtyIds[0] ?? '') ?? strings.clinicianFallback}
      />
    ),
    [
      discovery?.nextSlots,
      discovery?.pendingSlotProviderIds,
      onSelectProvider,
      specialtyNames,
      strings,
    ],
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
              <AppText style={styles.noteText} tone="secondary" variant="caption">
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
        ListHeaderComponent={
          <HomeHeader
            isDemo={isDemo}
            nextVisit={nextVisit}
            onFindCare={onFindCare}
            onOpenAppointment={onOpenAppointment}
            onSelectSpecialty={onSelectSpecialty}
            specialties={discovery?.specialties ?? []}
          />
        }
        contentContainerStyle={styles.content}
        data={providers}
        initialNumToRender={3}
        ItemSeparatorComponent={ProviderSeparator}
        keyExtractor={providerKeyExtractor}
        onRefresh={() => void handleRefresh()}
        refreshing={isRefreshing}
        renderItem={renderProvider}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

function HomeHeader({
  isDemo,
  nextVisit,
  onFindCare,
  onOpenAppointment,
  onSelectSpecialty,
  specialties,
}: {
  isDemo: boolean;
  nextVisit: HomeNextVisit | null;
  onFindCare: () => void;
  onOpenAppointment: ((appointmentId: string) => void) | undefined;
  onSelectSpecialty: ((specialtyId: string) => void) | undefined;
  specialties: readonly Specialty[];
}) {
  const theme = useAppTheme();
  const { intlLocale, locale } = useAppLocale();
  const strings = useStrings(homeStrings);
  const styles = useMemo(() => createStyles(theme), [theme]);
  const today = new Intl.DateTimeFormat(intlLocale, {
    day: 'numeric',
    month: 'long',
    weekday: 'long',
  }).format(new Date());

  return (
    <View style={styles.header}>
      <View style={styles.heading}>
        <View style={styles.eyebrow}>
          <AppText tone="secondary" variant="labelLarge">
            {today}
          </AppText>
          {isDemo && (
            <View style={styles.demoBadge}>
              <DecorativeIcon color={theme.colors.accent} name="flask-outline" size={14} />
              <AppText variant="labelSmall">{strings.demoBadge}</AppText>
            </View>
          )}
        </View>
        <AppText accessibilityRole="header" variant="display">
          {strings.greeting}
        </AppText>
      </View>

      {nextVisit && onOpenAppointment && (
        <NextVisitCard
          appointment={nextVisit.appointment}
          onPress={() => onOpenAppointment(nextVisit.appointment.id)}
          providerName={nextVisit.providerName}
        />
      )}

      {/* A compact entry point: the Find care tab and "See all" already lead
          to the same place, so the hero stays one tappable row instead of a
          large card with its own button. */}
      <Pressable
        accessibilityLabel={strings.featureTitle}
        accessibilityRole="button"
        onPress={onFindCare}
        style={({ pressed }) => pressed && styles.featurePressed}
      >
        <Surface padding="compact" style={styles.featureCard} variant="brand">
          <View style={styles.featureIcon}>
            <DecorativeIcon color={theme.colors.brand} name="search" size={22} />
          </View>
          <View style={styles.featureCopy}>
            <AppText variant="titleSmall">{strings.featureTitle}</AppText>
            <AppText numberOfLines={2} tone="secondary" variant="bodyMedium">
              {strings.featureDescription}
            </AppText>
          </View>
          <DecorativeIcon color={theme.colors.textSecondary} name="chevron-forward" size={20} />
        </Surface>
      </Pressable>

      {specialties.length > 0 && (
        <ScrollView
          contentContainerStyle={styles.specialtyRow}
          horizontal
          showsHorizontalScrollIndicator={false}
        >
          {specialties.map((specialty) => (
            <Chip
              key={specialty.id}
              label={specialty.name[locale]}
              onPress={() => (onSelectSpecialty ? onSelectSpecialty(specialty.id) : onFindCare())}
              selected={false}
            />
          ))}
        </ScrollView>
      )}

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
    eyebrow: {
      alignItems: 'center',
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: theme.spacing.xs,
      justifyContent: 'space-between',
    },
    demoBadge: {
      alignItems: 'center',
      backgroundColor: theme.colors.accentSoft,
      borderRadius: theme.radii.full,
      flexDirection: 'row',
      gap: theme.spacing.xxs,
      paddingHorizontal: theme.spacing.sm,
      paddingVertical: theme.spacing.xxs,
    },

    featureCard: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: theme.spacing.sm,
    },
    featureCopy: {
      flex: 1,
      gap: theme.spacing.xxs,
    },
    featurePressed: {
      opacity: 0.86,
      transform: [{ scale: 0.99 }],
    },
    featureIcon: {
      alignItems: 'center',
      backgroundColor: theme.colors.surfaceRaised,
      borderRadius: theme.radii.md,
      height: 44,
      justifyContent: 'center',
      width: 44,
    },
    sectionHeading: {
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    specialtyRow: {
      gap: theme.spacing.xs,
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
    noteText: {
      flex: 1,
    },
  });
}
