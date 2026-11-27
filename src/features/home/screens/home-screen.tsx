import { useCallback, useMemo } from 'react';
import { FlatList, StyleSheet, type ListRenderItem } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ProviderCard } from '@/features/care/components/provider-card';
import {
  ProviderListSeparator,
  providerKeyExtractor,
} from '@/features/care/components/provider-list';
import type { CareRepository } from '@/features/care/domain/repository';
import type { Provider } from '@/features/care/domain/types';
import { useProviderDiscovery } from '@/features/care/hooks/use-provider-discovery';
import { buildSpecialtyNameMap } from '@/features/care/presentation/formatters';
import { homeStrings } from '@/features/home/localization/home-strings';
import { usePullToRefresh } from '@/hooks/use-pull-to-refresh';
import { useAppLocale } from '@/localization/locale-provider';
import { useStrings } from '@/localization/use-strings';
import type { AppDataScope } from '@/services/query/data-scope';
import { useThemedStyles, type AppTheme } from '@/theme';

import { HomeFooter } from '../components/home-footer';
import { HomeHeader, type HomeNextVisit } from '../components/home-header';
import { HomeResultsState } from '../components/home-results-state';

const FEATURED_PROVIDERS_LIMIT = 3;

type HomeScreenProps = {
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
  const { locale } = useAppLocale();
  const strings = useStrings(homeStrings);
  const styles = useThemedStyles(createStyles);
  const { refresh, retry, state } = useProviderDiscovery({
    featuredOnly: true,
    queryScope,
    query: '',
    specialtyId: null,
    ...(repository ? { repository } : {}),
  });
  const { handleRefresh, isRefreshing } = usePullToRefresh(refresh);
  const discovery = state.status === 'success' ? state.data : null;
  const providers =
    discovery?.providers
      .filter((provider) => provider.isFeatured)
      .slice(0, FEATURED_PROVIDERS_LIMIT) ?? [];
  const specialtyNames = useMemo(
    () => buildSpecialtyNameMap(discovery?.specialties, locale),
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
        ListFooterComponent={<HomeFooter onOpenCatalogue={onOpenCatalogue} />}
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
        initialNumToRender={FEATURED_PROVIDERS_LIMIT}
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
  });
}
