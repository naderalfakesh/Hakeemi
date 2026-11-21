import { useCallback, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  Button,
  Chip,
  DecorativeIcon,
  EmptyState,
  Skeleton,
  StaleDataNotice,
  stateIllustrations,
} from '@/components/ui';
import { useAuthSession } from '@/features/auth/context/auth-session-provider';
import type { CareRepository } from '@/features/care/domain/repository';
import { useAppLocale } from '@/localization/locale-provider';
import { useStrings } from '@/localization/use-strings';
import { useIsOffline } from '@/services/connectivity/use-is-offline';
import type { AppDataScope } from '@/services/query/data-scope';
import { useAppTheme, useThemedStyles, type AppTheme } from '@/theme';

import { AppointmentCard } from '../components/appointment-card';
import { AppointmentsHeader } from '../components/appointments-header';
import { AppointmentsState } from '../components/appointments-state';
import type { AppointmentRepository } from '../domain/repository';
import {
  selectAppointments,
  useAppointments,
  type AppointmentFilter,
} from '../hooks/use-appointments';
import { appointmentsStrings } from '../localization/appointments-strings';

const filterKeys: readonly AppointmentFilter[] = ['upcoming', 'past', 'cancelled'];

type AppointmentsScreenProps = {
  appointmentRepository?: AppointmentRepository | undefined;
  careDataRepository?: CareRepository | undefined;
  onFindCare: () => void;
  onSignIn: () => void;
  onViewAppointment?: ((appointmentId: string) => void) | undefined;
  queryScope?: AppDataScope;
};

export function AppointmentsScreen({
  onFindCare,
  appointmentRepository,
  careDataRepository,
  onSignIn,
  onViewAppointment,
  queryScope = 'account',
}: AppointmentsScreenProps) {
  const session = useAuthSession();
  const strings = useStrings(appointmentsStrings);

  if (session.status !== 'authenticated' && session.status !== 'demo') {
    return (
      <AppointmentsState
        action={<Button onPress={onSignIn}>{strings.signIn}</Button>}
        description={strings.signInDescription}
        title={strings.signInTitle}
      />
    );
  }

  return (
    <AuthenticatedAppointments
      accountId={session.user?.id ?? null}
      appointmentRepository={appointmentRepository}
      careDataRepository={careDataRepository}
      onFindCare={onFindCare}
      onViewAppointment={onViewAppointment}
      queryScope={queryScope}
    />
  );
}

function AuthenticatedAppointments({
  accountId,
  appointmentRepository,
  careDataRepository,
  onFindCare,
  onViewAppointment,
  queryScope,
}: {
  accountId: string | null;
  appointmentRepository?: AppointmentRepository | undefined;
  careDataRepository?: CareRepository | undefined;
  onFindCare: () => void;
  onViewAppointment?: ((appointmentId: string) => void) | undefined;
  queryScope: AppDataScope;
}) {
  const theme = useAppTheme();
  const { locale } = useAppLocale();
  const strings = useStrings(appointmentsStrings);
  const styles = useThemedStyles(createStyles);
  const appointmentsQuery = useAppointments({
    accountId,
    careRepository: careDataRepository,
    queryScope,
    repository: appointmentRepository,
  });
  const isOffline = useIsOffline();
  const [filter, setFilter] = useState<AppointmentFilter>('upcoming');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await appointmentsQuery.refetch();
    } finally {
      setIsRefreshing(false);
    }
  }, [appointmentsQuery]);

  if (appointmentsQuery.isPending) {
    return (
      <SafeAreaView
        accessibilityLabel={strings.loadingAppointments}
        edges={['top']}
        style={styles.safeArea}
      >
        <View style={styles.content}>
          <AppointmentsHeader hasAppointments={false} onFindCare={onFindCare} />
          <View style={styles.filterRow}>
            <Skeleton height={44} radius="sm" width={112} />
            <Skeleton height={44} radius="sm" width={92} />
          </View>
          <Skeleton height={150} radius="lg" width="100%" />
        </View>
      </SafeAreaView>
    );
  }

  if (appointmentsQuery.isError && appointmentsQuery.data === undefined) {
    return (
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={
            <RefreshControl
              onRefresh={() => void handleRefresh()}
              refreshing={isRefreshing}
              tintColor={theme.colors.brand}
            />
          }
          showsVerticalScrollIndicator={false}
        >
          <AppointmentsHeader hasAppointments={false} onFindCare={onFindCare} />
          <EmptyState
            action={
              <Button onPress={() => void appointmentsQuery.refetch()} variant="secondary">
                {strings.tryAgain}
              </Button>
            }
            description={strings.errorDescription}
            icon={<DecorativeIcon color={theme.colors.brand} name="calendar-outline" size={34} />}
            title={strings.errorTitle}
          />
        </ScrollView>
      </SafeAreaView>
    );
  }

  const staleReason = isOffline ? 'offline' : appointmentsQuery.isError ? 'refresh-failed' : null;
  const hasAppointments = (appointmentsQuery.data?.length ?? 0) > 0;
  const visibleAppointments = selectAppointments(appointmentsQuery.data ?? [], filter);

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            onRefresh={() => void handleRefresh()}
            refreshing={isRefreshing}
            tintColor={theme.colors.brand}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        <AppointmentsHeader hasAppointments={hasAppointments} onFindCare={onFindCare} />

        {staleReason && (
          <StaleDataNotice reason={staleReason} updatedAt={appointmentsQuery.dataUpdatedAt} />
        )}

        <ScrollView
          contentContainerStyle={styles.filterRow}
          horizontal
          showsHorizontalScrollIndicator={false}
        >
          {filterKeys.map((candidate) => (
            <Chip
              key={candidate}
              label={strings.filterLabels[candidate]}
              onPress={() => setFilter(candidate)}
              selected={candidate === filter}
            />
          ))}
        </ScrollView>

        {visibleAppointments.length === 0 ? (
          <EmptyState
            description={strings.emptyDescriptions[filter]}
            illustration={stateIllustrations.noAppointments}
            title={strings.emptyTitles[filter]}
          />
        ) : (
          visibleAppointments.map(({ appointment, provider }) => (
            <AppointmentCard
              appointment={appointment}
              key={appointment.id}
              onPress={onViewAppointment ? () => onViewAppointment(appointment.id) : undefined}
              providerName={provider ? provider.displayName[locale] : strings.providerFallback}
            />
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function createStyles(theme: AppTheme) {
  return StyleSheet.create({
    safeArea: {
      backgroundColor: theme.colors.canvas,
      flex: 1,
    },
    content: {
      alignSelf: 'center',
      gap: theme.spacing.md,
      maxWidth: theme.sizes.contentMaxWidth,
      paddingBottom: theme.spacing.xxxl,
      paddingHorizontal: theme.spacing.lg,
      paddingTop: theme.spacing.lg,
      width: '100%',
    },
    filterRow: {
      gap: theme.spacing.xs,
      paddingBottom: theme.spacing.xxs,
    },
  });
}
