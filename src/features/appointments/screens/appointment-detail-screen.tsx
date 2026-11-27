import * as Crypto from 'expo-crypto';
import { ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/ui';
import { useAuthSession } from '@/features/auth/context/auth-session-provider';
import { careRepository } from '@/features/care/data/care-repository';
import type { CareRepository } from '@/features/care/domain/repository';
import { useAppLocale } from '@/localization/locale-provider';
import { useStrings } from '@/localization/use-strings';
import type { AppDataScope } from '@/services/query/data-scope';
import { useThemedStyles, type AppTheme } from '@/theme';

import { AppointmentDetailActions } from '../components/appointment-detail-actions';
import { AppointmentDetailHeader } from '../components/appointment-detail-header';
import {
  AppointmentDetailLoading,
  AppointmentDetailState,
} from '../components/appointment-detail-state';
import { AppointmentSummaryCard } from '../components/appointment-summary-card';
import { calendarLinkOwner } from '../data/calendar-link-storage';
import { canManageAppointment } from '../domain/appointment-access';
import type { AppointmentRepository } from '../domain/repository';
import { useAppointmentActions } from '../hooks/use-appointment-actions';
import { useAppointmentCalendar } from '../hooks/use-appointment-calendar';
import { useAppointmentDetail } from '../hooks/use-appointment-detail';
import { useAppointmentProvider } from '../hooks/use-appointment-provider';
import { appointmentDetailStrings } from '../localization/appointment-detail-strings';

type AppointmentDetailScreenProps = {
  appointmentId: string;
  appointmentRepository?: AppointmentRepository | undefined;
  careDataRepository?: CareRepository;
  createRequestId?: () => string;
  onBack: () => void;
  onFindCare: () => void;
  queryScope?: AppDataScope;
};

export function AppointmentDetailScreen({
  appointmentId,
  appointmentRepository,
  careDataRepository = careRepository,
  createRequestId = Crypto.randomUUID,
  onBack,
  onFindCare,
  queryScope = 'account',
}: AppointmentDetailScreenProps) {
  const session = useAuthSession();
  const strings = useStrings(appointmentDetailStrings);

  if (session.status !== 'authenticated' && session.status !== 'demo') {
    return (
      <AppointmentDetailState
        action={<Button onPress={onBack}>{strings.backToAppointments}</Button>}
        description={strings.signInDescription}
        onBack={onBack}
        title={strings.signInTitle}
      />
    );
  }

  return (
    <AuthenticatedAppointmentDetail
      accountId={session.user?.id ?? null}
      appointmentId={appointmentId}
      appointmentRepository={appointmentRepository}
      careDataRepository={careDataRepository}
      createRequestId={createRequestId}
      onBack={onBack}
      onFindCare={onFindCare}
      queryScope={queryScope}
    />
  );
}

type AuthenticatedAppointmentDetailProps = {
  accountId: string | null;
  appointmentId: string;
  appointmentRepository?: AppointmentRepository | undefined;
  careDataRepository: CareRepository;
  createRequestId: () => string;
  onBack: () => void;
  onFindCare: () => void;
  queryScope: AppDataScope;
};

function AuthenticatedAppointmentDetail({
  accountId,
  appointmentId,
  appointmentRepository,
  careDataRepository,
  createRequestId,
  onBack,
  onFindCare,
  queryScope,
}: AuthenticatedAppointmentDetailProps) {
  const { locale } = useAppLocale();
  const strings = useStrings(appointmentDetailStrings);
  const styles = useThemedStyles(createStyles);
  const detailQuery = useAppointmentDetail(appointmentId, {
    accountId,
    queryScope,
    repository: appointmentRepository,
  });
  const { provider: resolvedProvider, providerState } = useAppointmentProvider(
    detailQuery.data?.providerId ?? '',
    { queryScope, repository: careDataRepository },
  );
  const providerName = resolvedProvider
    ? resolvedProvider.displayName[locale]
    : strings.appointmentDetails;
  // The calendar follow-up lives here, not in its section, because the
  // section is hidden while the user reschedules or cancels.
  const calendar = useAppointmentCalendar({
    appointment: detailQuery.data ?? null,
    owner: calendarLinkOwner(queryScope, accountId),
    providerName,
  });
  const actions = useAppointmentActions({
    appointmentId: detailQuery.data?.id ?? appointmentId,
    createRequestId,
    onCancelled: () => void calendar.followCancel(),
    onRescheduled: (time) => void calendar.followReschedule(time),
    queryScope,
    repository: appointmentRepository,
  });

  if (detailQuery.isPending) {
    return <AppointmentDetailLoading />;
  }

  if (detailQuery.isError) {
    return (
      <AppointmentDetailState
        action={<Button onPress={() => void detailQuery.refetch()}>{strings.tryAgain}</Button>}
        description={strings.checkConnection}
        onBack={onBack}
        title={strings.unavailableTitle}
      />
    );
  }

  const appointment = detailQuery.data;

  if (!appointment) {
    return (
      <AppointmentDetailState
        action={<Button onPress={onBack}>{strings.backToAppointments}</Button>}
        description={strings.notFoundDescription}
        onBack={onBack}
        title={strings.notFoundTitle}
      />
    );
  }

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <AppointmentDetailHeader
          appointment={appointment}
          isProviderLoading={!resolvedProvider && providerState.status === 'loading'}
          onBack={onBack}
          providerName={providerName}
        />

        <AppointmentSummaryCard appointment={appointment} />

        <AppointmentDetailActions
          actions={actions}
          appointment={appointment}
          calendar={calendar}
          canManage={canManageAppointment(appointment)}
          onFindCare={onFindCare}
          providerState={providerState}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

function createStyles(theme: AppTheme) {
  return StyleSheet.create({
    safeArea: { backgroundColor: theme.colors.canvas, flex: 1 },
    content: {
      alignSelf: 'center',
      gap: theme.spacing.lg,
      maxWidth: theme.sizes.contentMaxWidth,
      paddingBottom: theme.spacing.xxxl,
      paddingHorizontal: theme.spacing.lg,
      paddingTop: theme.spacing.md,
      width: '100%',
    },
  });
}
