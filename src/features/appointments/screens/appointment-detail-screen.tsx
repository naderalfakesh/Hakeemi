import * as Crypto from 'expo-crypto';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  AppText,
  Button,
  DecorativeIcon,
  IconButton,
  InlineError,
  Skeleton,
  Surface,
} from '@/components/ui';
import { useAuthSession } from '@/features/auth/context/auth-session-provider';
import type { CareRepository } from '@/features/care/domain/repository';
import { careRepository } from '@/features/care/data/care-repository';
import { useAppLocale } from '@/localization/locale-provider';
import { useStrings } from '@/localization/use-strings';
import type { AppDataScope } from '@/services/query/data-scope';
import { useAppTheme, useThemedStyles, type AppTheme } from '@/theme';

import { AppointmentCalendarSection } from '../components/appointment-calendar-section';
import {
  AppointmentDetailLoading,
  AppointmentDetailState,
} from '../components/appointment-detail-state';
import { AppointmentStatusPill } from '../components/appointment-status-pill';
import { AppointmentSummaryCard } from '../components/appointment-summary-card';
import { CancelConfirmation } from '../components/cancel-confirmation';
import { RescheduleSection } from '../components/reschedule-section';
import { calendarLinkOwner } from '../data/calendar-link-storage';
import { useAppointmentActions } from '../hooks/use-appointment-actions';
import { useAppointmentCalendar } from '../hooks/use-appointment-calendar';
import { useAppointmentDetail } from '../hooks/use-appointment-detail';
import { useAppointmentProvider } from '../hooks/use-appointment-provider';
import { canManageAppointment } from '../domain/appointment-access';
import type { AppointmentRepository } from '../domain/repository';
import { formatAppointmentDate } from '../localization/format-appointment-time';
import { appointmentDetailStrings } from '../localization/appointment-detail-strings';
import { localizeAppointmentError } from '../localization/appointment-error-strings';

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

function AuthenticatedAppointmentDetail({
  accountId,
  appointmentId,
  appointmentRepository,
  careDataRepository,
  createRequestId,
  onBack,
  onFindCare,
  queryScope,
}: {
  accountId: string | null;
  appointmentId: string;
  appointmentRepository?: AppointmentRepository | undefined;
  careDataRepository: CareRepository;
  createRequestId: () => string;
  onBack: () => void;
  onFindCare: () => void;
  queryScope: AppDataScope;
}) {
  const theme = useAppTheme();
  const { intlLocale, locale } = useAppLocale();
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

  const canManage = canManageAppointment(appointment);

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.topBar}>
          <IconButton
            accessibilityLabel={strings.backToAppointments}
            onPress={onBack}
            variant="soft"
          >
            <DecorativeIcon color={theme.colors.brand} name="arrow-back" size={22} />
          </IconButton>
          <AppText tone="secondary" variant="labelLarge">
            {strings.appointmentDetails}
          </AppText>
        </View>

        <View style={styles.heading}>
          {resolvedProvider || providerState.status !== 'loading' ? (
            <AppText accessibilityRole="header" variant="titleLarge">
              {providerName}
            </AppText>
          ) : (
            <Skeleton height={32} width={180} />
          )}
          <AppointmentStatusPill appointment={appointment} />
        </View>

        <AppointmentSummaryCard appointment={appointment} />

        {/* Only one intent is visible at a time: the default action stack,
            the focused cancel confirmation, or the reschedule flow. The stack
            leads with rescheduling and keeps one rhythm down to cancelling. */}
        {canManage && !actions.confirmingCancel && !actions.showReschedule && (
          <View style={styles.actions}>
            <Button onPress={actions.openReschedule}>{strings.reschedule}</Button>
            <AppointmentCalendarSection
              appointmentStatus={appointment.status}
              calendar={calendar}
            />
            <Button
              accessibilityHint={strings.cancelAppointmentHint}
              onPress={actions.startCancel}
              variant="dangerSoft"
            >
              {strings.cancelAppointment}
            </Button>
          </View>
        )}

        {/* The section stays for a cancelled visit so its calendar event is
            removed and the outcome reported. */}
        {(appointment.status === 'cancelled' ||
          (appointment.status === 'confirmed' && !canManage)) && (
          <AppointmentCalendarSection appointmentStatus={appointment.status} calendar={calendar} />
        )}

        {appointment.status === 'cancelled' && appointment.cancelledAt && (
          <Surface padding="compact" style={styles.notice} variant="muted">
            <DecorativeIcon color={theme.colors.warning} name="information-circle" size={20} />
            <AppText style={styles.flexText} tone="secondary" variant="bodyMedium">
              {strings.cancelledOn(formatAppointmentDate(appointment.cancelledAt, intlLocale))}
            </AppText>
          </Surface>
        )}

        {actions.confirmingCancel && canManage && (
          <CancelConfirmation
            isCancelling={actions.isCancelling}
            onConfirm={() => void actions.confirmCancel()}
            onKeep={actions.dismissCancel}
          />
        )}

        {actions.showReschedule && canManage && (
          <>
            <Button onPress={actions.closeReschedule} variant="secondary">
              {strings.keepCurrentTime}
            </Button>
            <RescheduleSection
              currentSlotId={appointment.slotId}
              onSelect={(slotId) => void actions.reschedule(slotId)}
              providerState={providerState}
              submitting={actions.isRescheduling}
            />
          </>
        )}

        {actions.actionError && (
          <InlineError message={localizeAppointmentError(actions.actionError, locale)} />
        )}

        {!canManage && appointment.status !== 'cancelled' && (
          <Surface padding="compact" variant="muted">
            <AppText tone="secondary" variant="bodyMedium">
              {strings.historyNotice}
            </AppText>
          </Surface>
        )}

        {!actions.confirmingCancel && !actions.showReschedule && (
          <Button onPress={onFindCare} variant="tertiary">
            {strings.findAnotherClinician}
          </Button>
        )}
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
    topBar: { alignItems: 'center', flexDirection: 'row', gap: theme.spacing.sm },
    heading: { gap: theme.spacing.sm },
    flexText: { flex: 1 },
    notice: { alignItems: 'flex-start', flexDirection: 'row', gap: theme.spacing.sm },
    actions: { gap: theme.spacing.sm },
  });
}
