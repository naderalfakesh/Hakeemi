import { useCallback, useMemo, useState } from 'react';
import { FlatList, StyleSheet, View, type ListRenderItem } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText, Button, DecorativeIcon } from '@/components/ui';
import { ProviderCard } from '@/features/care/components/provider-card';
import {
  ProviderListSeparator,
  providerKeyExtractor,
} from '@/features/care/components/provider-list';
import type { CareRepository } from '@/features/care/domain/repository';
import type { Provider } from '@/features/care/domain/types';
import { useProviderDiscovery } from '@/features/care/hooks/use-provider-discovery';
import { homeStrings } from '@/features/home/localization/home-strings';
import { useAppLocale } from '@/localization/locale-provider';
import { useStrings } from '@/localization/use-strings';
import type { AppDataScope } from '@/services/query/data-scope';
import { useAppTheme, useThemedStyles, type AppTheme } from '@/theme';

import { HomeHeader, type HomeNextVisit } from '../components/home-header';
import { HomeResultsState } from '../components/home-results-state';

type HomeScreenProps = {
  /** Shows the demo badge so fictional data is never mistaken for an account. */
  isDemo?: boolean;
  nextVisit?: HomeNextVisit | null;
  onFindCare: () => void;
  onOpenAppointment?: (appointmentId: string) => void;
  onOpenCatalogue?: () => void;
  onSelectProvider: (providerId: string) => void;
  onSelectSpecialty?: ((specialtyId: string) => void) | undefined;
  queryScope?: AppDataScope;
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
  const styles = useThemedStyles(createStyles);
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
        ItemSeparatorComponent={ProviderListSeparator}
        keyExtractor={providerKeyExtractor}
        onRefresh={() => void handleRefresh()}
        refreshing={isRefreshing}
        renderItem={renderProvider}
        showsVerticalScrollIndicator={false}
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
