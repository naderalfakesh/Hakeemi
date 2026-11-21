import { useQueryClient } from '@tanstack/react-query';
import * as Crypto from 'expo-crypto';
import { useRef, useState } from 'react';
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
import { careQueryKeys } from '@/features/care/data/query-keys';
import type { Provider } from '@/features/care/domain/types';
import { useProviderDetail } from '@/features/care/hooks/use-provider-detail';
import { formatAppointmentReference } from '@/features/appointments/domain/reference';
import { formatTimeZoneName } from '@/localization/format';
import { useAppLocale } from '@/localization/locale-provider';
import { useStrings } from '@/localization/use-strings';
import { triggerHaptic } from '@/services/haptics/haptics';
import type { AppDataScope } from '@/services/query/data-scope';
import { useAppTheme, useThemedStyles, type AppTheme } from '@/theme';

import { AppointmentCalendarSection } from '../components/appointment-calendar-section';
import { AppointmentDetailRow } from '../components/appointment-detail-row';
import {
  AppointmentDetailLoading,
  AppointmentDetailState,
} from '../components/appointment-detail-state';
import { AppointmentStatusPill } from '../components/appointment-status-pill';
import { CancelConfirmation } from '../components/cancel-confirmation';
import { RescheduleSection } from '../components/reschedule-section';
import { calendarLinkOwner } from '../data/calendar-link-storage';
import { useAppointmentCalendar } from '../hooks/use-appointment-calendar';
import { useCancelAppointment } from '../hooks/use-cancel-appointment';
import { useAppointmentDetail } from '../hooks/use-appointment-detail';
import { useRescheduleAppointment } from '../hooks/use-reschedule-appointment';
import type { AppointmentRepository } from '../domain/repository';
import {
  formatAppointmentDate,
  formatAppointmentDateTime,
} from '../localization/format-appointment-time';
import { appointmentDetailStrings } from '../localization/appointment-detail-strings';
import { appointmentStatusStrings } from '../localization/appointment-status-strings';
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
  const statusStrings = useStrings(appointmentStatusStrings);
  const styles = useThemedStyles(createStyles);
  const queryClient = useQueryClient();
  const detailQuery = useAppointmentDetail(appointmentId, {
    accountId,
    queryScope,
    repository: appointmentRepository,
  });
  const providerId = detailQuery.data?.providerId ?? '';
  const providerQuery = useProviderDetail(providerId, {
    queryScope,
    repository: careDataRepository,
  });
  const cancelMutation = useCancelAppointment({
    queryScope,
    repository: appointmentRepository,
  });
  const rescheduleMutation = useRescheduleAppointment({
    queryScope,
    repository: appointmentRepository,
  });
  const [confirmingCancel, setConfirmingCancel] = useState(false);
  const [showReschedule, setShowReschedule] = useState(false);
  // A retry of a failed action reuses its request ID, so the server can
  // replay an action that committed but whose response never arrived.
  const cancelRequestId = useRef<string | null>(null);
  const rescheduleRequest = useRef<{ requestId: string; slotId: string } | null>(null);
  const cachedProvider =
    providerId.length > 0
      ? (queryClient.getQueryData<{ provider: Provider } | null>(
          careQueryKeys.detail(providerId, queryScope),
        )?.provider ??
        queryClient.getQueryData<Provider | null>(
          careQueryKeys.providerSummary(providerId, queryScope),
        ) ??
        null)
      : null;
  const resolvedProvider =
    providerQuery.state.status === 'success' ? providerQuery.state.data.provider : cachedProvider;
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

  const appointmentRecord = appointment;

  const canManage =
    appointment.status === 'confirmed' && new Date(appointment.startsAt) > new Date();
  const actionError = cancelMutation.error ?? rescheduleMutation.error;

  // Failures are shown from the mutation's error state, so the handlers
  // settle instead of rejecting.
  async function confirmCancel() {
    await triggerHaptic('warning');
    cancelRequestId.current ??= createRequestId();

    try {
      await cancelMutation.cancel({
        appointmentId: appointmentRecord.id,
        requestId: cancelRequestId.current,
      });
    } catch {
      return;
    }

    cancelRequestId.current = null;
    setConfirmingCancel(false);
    void calendar.followCancel();
  }

  async function reschedule(slotId: string) {
    if (rescheduleRequest.current?.slotId !== slotId) {
      rescheduleRequest.current = { requestId: createRequestId(), slotId };
    }

    let moved: Awaited<ReturnType<typeof rescheduleMutation.reschedule>>['appointment'];

    try {
      ({ appointment: moved } = await rescheduleMutation.reschedule({
        appointmentId: appointmentRecord.id,
        requestId: rescheduleRequest.current.requestId,
        slotId,
      }));
    } catch {
      return;
    }

    rescheduleRequest.current = null;
    setShowReschedule(false);
    void calendar.followReschedule({
      endsAt: moved.endsAt,
      startsAt: moved.startsAt,
      timezone: moved.timezone,
    });
  }

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
          {resolvedProvider || providerQuery.state.status !== 'loading' ? (
            <AppText accessibilityRole="header" variant="titleLarge">
              {providerName}
            </AppText>
          ) : (
            <Skeleton height={32} width={180} />
          )}
          <AppointmentStatusPill appointment={appointment} />
        </View>

        <Surface padding="spacious" style={styles.summary} variant="brand">
          <AppointmentDetailRow
            icon="calendar-outline"
            label={formatAppointmentDateTime(appointment, intlLocale)}
            tone="primary"
          />
          <AppointmentDetailRow
            icon={appointment.visitMode === 'video' ? 'videocam-outline' : 'location-outline'}
            label={`${statusStrings.visitModeLabels[appointment.visitMode]} · ${formatTimeZoneName(
              appointment.timezone,
              locale,
              appointment.startsAt,
            )}`}
          />
          <AppText selectable tone="secondary" variant="caption">
            {strings.reference(formatAppointmentReference(appointment.id))}
          </AppText>
        </Surface>

        {/* Only one intent is visible at a time: the default action stack,
            the focused cancel confirmation, or the reschedule flow. The stack
            leads with rescheduling and keeps one rhythm down to cancelling. */}
        {canManage && !confirmingCancel && !showReschedule && (
          <View style={styles.actions}>
            <Button onPress={() => setShowReschedule(true)}>{strings.reschedule}</Button>
            <AppointmentCalendarSection
              appointmentStatus={appointment.status}
              calendar={calendar}
            />
            <Button
              accessibilityHint={strings.cancelAppointmentHint}
              onPress={() => setConfirmingCancel(true)}
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

        {confirmingCancel && canManage && (
          <CancelConfirmation
            isCancelling={cancelMutation.status === 'pending'}
            onConfirm={() => void confirmCancel()}
            onKeep={() => setConfirmingCancel(false)}
          />
        )}

        {showReschedule && canManage && (
          <>
            <Button onPress={() => setShowReschedule(false)} variant="secondary">
              {strings.keepCurrentTime}
            </Button>
            <RescheduleSection
              currentSlotId={appointment.slotId}
              onSelect={(slotId) => void reschedule(slotId)}
              providerState={providerQuery.state}
              submitting={rescheduleMutation.status === 'pending'}
            />
          </>
        )}

        {actionError && <InlineError message={localizeAppointmentError(actionError, locale)} />}

        {!canManage && appointment.status !== 'cancelled' && (
          <Surface padding="compact" variant="muted">
            <AppText tone="secondary" variant="bodyMedium">
              {strings.historyNotice}
            </AppText>
          </Surface>
        )}

        {!confirmingCancel && !showReschedule && (
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
    summary: { gap: theme.spacing.md },
    flexText: { flex: 1 },
    notice: { alignItems: 'flex-start', flexDirection: 'row', gap: theme.spacing.sm },
    actions: { gap: theme.spacing.sm },
  });
}
