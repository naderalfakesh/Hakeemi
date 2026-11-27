import { useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  Button,
  DecorativeIcon,
  EmptyState,
  StaleDataNotice,
  stateIllustrations,
} from '@/components/ui';
import { useAuthSession } from '@/features/auth/context/auth-session-provider';
import type { CareRepository } from '@/features/care/domain/repository';
import { usePullToRefresh } from '@/hooks/use-pull-to-refresh';
import { useAppLocale } from '@/localization/locale-provider';
import { useStrings } from '@/localization/use-strings';
import { useIsOffline } from '@/services/connectivity/use-is-offline';
import type { AppDataScope } from '@/services/query/data-scope';
import { useAppTheme, useThemedStyles, type AppTheme } from '@/theme';

import { AppointmentCard } from '../components/appointment-card';
import { AppointmentsFilterBar } from '../components/appointments-filter-bar';
import { AppointmentsHeader } from '../components/appointments-header';
import { AppointmentsLoading } from '../components/appointments-loading';
import { AppointmentsState } from '../components/appointments-state';
import type { AppointmentRepository } from '../domain/repository';
import {
  selectAppointments,
  useAppointments,
  type AppointmentFilter,
} from '../hooks/use-appointments';
import { appointmentsStrings } from '../localization/appointments-strings';

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

type AuthenticatedAppointmentsProps = {
  accountId: string | null;
  appointmentRepository?: AppointmentRepository | undefined;
  careDataRepository?: CareRepository | undefined;
  onFindCare: () => void;
  onViewAppointment?: ((appointmentId: string) => void) | undefined;
  queryScope: AppDataScope;
};

function AuthenticatedAppointments({
  accountId,
  appointmentRepository,
  careDataRepository,
  onFindCare,
  onViewAppointment,
  queryScope,
}: AuthenticatedAppointmentsProps) {
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
  const { handleRefresh, isRefreshing } = usePullToRefresh(appointmentsQuery.refetch);

  if (appointmentsQuery.isPending) {
    return <AppointmentsLoading onFindCare={onFindCare} />;
  }

  const refreshControl = (
    <RefreshControl
      onRefresh={() => void handleRefresh()}
      refreshing={isRefreshing}
      tintColor={theme.colors.brand}
    />
  );

  if (appointmentsQuery.isError && appointmentsQuery.data === undefined) {
    return (
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={refreshControl}
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
        refreshControl={refreshControl}
        showsVerticalScrollIndicator={false}
      >
        <AppointmentsHeader hasAppointments={hasAppointments} onFindCare={onFindCare} />

        {staleReason && (
          <StaleDataNotice reason={staleReason} updatedAt={appointmentsQuery.dataUpdatedAt} />
        )}

        <AppointmentsFilterBar filter={filter} onChange={setFilter} />

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
  });
}
