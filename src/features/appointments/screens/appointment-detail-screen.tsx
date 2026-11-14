import { useQueryClient } from '@tanstack/react-query';
import * as Crypto from 'expo-crypto';
import { useMemo, useRef, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  AppText,
  Button,
  DecorativeIcon,
  EmptyState,
  IconButton,
  InlineError,
  Skeleton,
  stateIllustrations,
  Surface,
} from '@/components/ui';
import { useAuthSession } from '@/features/auth/context/auth-session-provider';
import { AvailabilityCalendar } from '@/features/care/components/availability-calendar';
import type { CareRepository } from '@/features/care/domain/repository';
import { careRepository } from '@/features/care/data/care-repository';
import { careQueryKeys } from '@/features/care/data/query-keys';
import type { Provider } from '@/features/care/domain/types';
import { useProviderDetail } from '@/features/care/hooks/use-provider-detail';
import { formatTimeZoneName } from '@/localization/format';
import { useAppLocale } from '@/localization/locale-provider';
import { useStrings } from '@/localization/use-strings';
import { triggerHaptic } from '@/services/haptics/haptics';
import { useAppTheme, type AppTheme } from '@/theme';

import { AppointmentCalendarSection } from '../components/appointment-calendar-section';
import { calendarLinkOwner } from '../data/calendar-link-storage';
import { useAppointmentCalendar } from '../hooks/use-appointment-calendar';
import { useCancelAppointment } from '../hooks/use-cancel-appointment';
import { useAppointmentDetail } from '../hooks/use-appointment-detail';
import { useRescheduleAppointment } from '../hooks/use-reschedule-appointment';
import type { AppointmentRepository } from '../domain/repository';
import type { Appointment } from '../domain/types';
import { appointmentDetailStrings } from '../localization/appointment-detail-strings';
import { appointmentStatusStrings } from '../localization/appointment-status-strings';
import { localizeAppointmentError } from '../localization/appointment-error-strings';

const alwaysConnected = async () => true;

export function AppointmentDetailScreen({
  appointmentId,
  appointmentRepository,
  careDataRepository = careRepository,
  createRequestId = Crypto.randomUUID,
  onBack,
  onFindCare,
  queryScope = 'account',
}: {
  appointmentId: string;
  appointmentRepository?: AppointmentRepository | undefined;
  careDataRepository?: CareRepository;
  createRequestId?: () => string;
  onBack: () => void;
  onFindCare: () => void;
  queryScope?: 'account' | 'demo';
}) {
  const session = useAuthSession();
  const strings = useStrings(appointmentDetailStrings);

  if (session.status !== 'authenticated' && session.status !== 'demo') {
    return (
      <DetailState
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
  queryScope: 'account' | 'demo';
}) {
  const theme = useAppTheme();
  const { intlLocale, locale } = useAppLocale();
  const strings = useStrings(appointmentDetailStrings);
  const statusStrings = useStrings(appointmentStatusStrings);
  const styles = useMemo(() => createStyles(theme), [theme]);
  const queryClient = useQueryClient();
  const detailQuery = useAppointmentDetail(
    appointmentId,
    appointmentRepository,
    queryScope,
    accountId,
  );
  const providerId = detailQuery.data?.providerId ?? '';
  const providerQuery = useProviderDetail(providerId, careDataRepository, queryScope);
  const cancelMutation = useCancelAppointment(
    queryScope === 'demo'
      ? { checkConnection: alwaysConnected, repository: appointmentRepository }
      : { repository: appointmentRepository },
  );
  const rescheduleMutation = useRescheduleAppointment(
    queryScope === 'demo'
      ? { checkConnection: alwaysConnected, repository: appointmentRepository }
      : { repository: appointmentRepository },
  );
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
    return <DetailLoading />;
  }

  if (detailQuery.isError) {
    return (
      <DetailState
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
      <DetailState
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
          <StatusPill appointment={appointment} />
        </View>

        <Surface padding="spacious" style={styles.summary} variant="brand">
          <DetailRow
            icon="calendar-outline"
            label={formatAppointment(appointment, intlLocale)}
            tone="primary"
          />
          <DetailRow
            icon={appointment.visitMode === 'video' ? 'videocam-outline' : 'location-outline'}
            label={`${statusStrings.visitModeLabels[appointment.visitMode]} · ${formatTimeZoneName(
              appointment.timezone,
              locale,
              appointment.startsAt,
            )}`}
          />
          <AppText selectable tone="secondary" variant="caption">
            {strings.reference(appointment.id.slice(-10).toUpperCase())}
          </AppText>
        </Surface>

        {/* The section stays for a cancelled visit so its calendar event is
            removed and the outcome reported. */}
        {(appointment.status === 'confirmed' || appointment.status === 'cancelled') &&
          !confirmingCancel &&
          !showReschedule && (
            <AppointmentCalendarSection
              appointmentStatus={appointment.status}
              calendar={calendar}
            />
          )}

        {appointment.status === 'cancelled' && appointment.cancelledAt && (
          <Surface padding="compact" style={styles.notice} variant="muted">
            <DecorativeIcon color={theme.colors.warning} name="information-circle" size={20} />
            <AppText style={styles.flexText} tone="secondary" variant="bodyMedium">
              {strings.cancelledOn(formatDate(appointment.cancelledAt, intlLocale))}
            </AppText>
          </Surface>
        )}

        {/* Only one intent is visible at a time: the default action stack,
            the focused cancel confirmation, or the reschedule flow. */}
        {canManage && !confirmingCancel && !showReschedule && (
          <View style={styles.actions}>
            <Button onPress={() => setShowReschedule(true)} variant="secondary">
              {strings.reschedule}
            </Button>
            <Button
              accessibilityHint={strings.cancelAppointmentHint}
              onPress={() => setConfirmingCancel(true)}
              variant="dangerSoft"
            >
              {strings.cancelAppointment}
            </Button>
          </View>
        )}

        {confirmingCancel && canManage && (
          <Surface padding="spacious" style={styles.confirmation} variant="muted">
            <AppText variant="titleSmall">{strings.cancelConfirmTitle}</AppText>
            <AppText tone="secondary" variant="bodyMedium">
              {strings.cancelConfirmDescription}
            </AppText>
            <View style={styles.inlineActions}>
              <Button onPress={() => setConfirmingCancel(false)} variant="secondary">
                {strings.keepAppointment}
              </Button>
              <Button
                accessibilityHint={strings.confirmCancellationHint}
                busy={cancelMutation.status === 'pending'}
                onPress={() => void confirmCancel()}
                variant="danger"
              >
                {strings.confirmCancellation}
              </Button>
            </View>
          </Surface>
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

function RescheduleSection({
  currentSlotId,
  onSelect,
  providerState,
  submitting,
}: {
  currentSlotId: string;
  onSelect: (slotId: string) => void;
  providerState: ReturnType<typeof useProviderDetail>['state'];
  submitting: boolean;
}) {
  const theme = useAppTheme();
  const { locale } = useAppLocale();
  const strings = useStrings(appointmentDetailStrings);
  const styles = useMemo(() => createStyles(theme), [theme]);

  if (providerState.status === 'loading') {
    return (
      <Surface padding="spacious" variant="plain">
        <Skeleton height={22} width="60%" />
        <Skeleton height={52} radius="md" width="100%" />
      </Surface>
    );
  }

  if (providerState.status !== 'success') {
    return (
      <Surface padding="compact" variant="muted">
        <AppText tone="secondary" variant="bodyMedium">
          {strings.rescheduleLoadError}
        </AppText>
      </Surface>
    );
  }

  const slots = providerState.data.slots.filter((slot) => slot.id !== currentSlotId);

  return (
    <Surface padding="spacious" style={styles.reschedule} variant="plain">
      <AppText variant="titleSmall">{strings.chooseNewTime}</AppText>
      <AppText tone="secondary" variant="bodyMedium">
        {strings.rescheduleDescription}
      </AppText>
      {slots.length === 0 ? (
        <AppText tone="secondary" variant="bodyMedium">
          {strings.noOtherTimes}
        </AppText>
      ) : (
        <AvailabilityCalendar
          availabilityWindow={providerState.data.availabilityWindow}
          isSubmitting={submitting}
          locale={locale}
          onChooseSlot={(slot) => onSelect(slot.id)}
          slots={slots}
        />
      )}
    </Surface>
  );
}

function StatusPill({ appointment }: { appointment: Appointment }) {
  const theme = useAppTheme();
  const statusStrings = useStrings(appointmentStatusStrings);
  const palette = statusPillPalette(theme, appointment);
  return (
    <View style={[createStyles(theme).statusPill, { backgroundColor: palette.background }]}>
      <AppText style={{ color: palette.foreground }} variant="labelSmall">
        {statusStrings.statusLabels[appointment.status]}
      </AppText>
    </View>
  );
}

function statusPillPalette(theme: AppTheme, appointment: Appointment) {
  if (appointment.status === 'confirmed') {
    return { background: theme.colors.successSoft, foreground: theme.colors.success };
  }

  if (appointment.status === 'cancelled') {
    return { background: theme.colors.warningSoft, foreground: theme.colors.warning };
  }

  return { background: theme.colors.surfaceMuted, foreground: theme.colors.textSecondary };
}

function DetailRow({
  icon,
  label,
  tone = 'secondary',
}: {
  icon: 'calendar-outline' | 'location-outline' | 'videocam-outline';
  label: string;
  tone?: 'primary' | 'secondary';
}) {
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  return (
    <View style={styles.detailRow}>
      <DecorativeIcon color={theme.colors.brand} name={icon} size={20} />
      <AppText style={styles.flexText} tone={tone} variant="bodyMedium">
        {label}
      </AppText>
    </View>
  );
}

function DetailLoading() {
  const theme = useAppTheme();
  const strings = useStrings(appointmentDetailStrings);
  const styles = useMemo(() => createStyles(theme), [theme]);
  return (
    <SafeAreaView
      accessibilityLabel={strings.loadingAppointment}
      edges={['top']}
      style={styles.safeArea}
    >
      <View style={styles.loadingContent}>
        <Skeleton height={48} radius="md" width={48} />
        <Skeleton height={36} width="68%" />
        <Skeleton height={154} radius="lg" width="100%" />
        <Skeleton height={52} radius="md" width="100%" />
      </View>
    </SafeAreaView>
  );
}

function DetailState({
  action,
  description,
  onBack,
  title,
}: {
  action: React.ReactNode;
  description: string;
  onBack: () => void;
  title: string;
}) {
  const theme = useAppTheme();
  const strings = useStrings(appointmentDetailStrings);
  const styles = useMemo(() => createStyles(theme), [theme]);
  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
      <View style={styles.stateBack}>
        <IconButton accessibilityLabel={strings.backToAppointments} onPress={onBack} variant="soft">
          <DecorativeIcon color={theme.colors.brand} name="arrow-back" size={22} />
        </IconButton>
      </View>
      <EmptyState
        action={action}
        description={description}
        illustration={stateIllustrations.noAppointments}
        title={title}
      />
    </SafeAreaView>
  );
}

function formatAppointment(appointment: Appointment, locale = 'en-AE') {
  return new Intl.DateTimeFormat(locale, {
    dateStyle: 'full',
    timeStyle: 'short',
    timeZone: appointment.timezone,
  }).format(new Date(appointment.startsAt));
}

function formatDate(value: string, locale = 'en-AE') {
  return new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(new Date(value));
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
    stateBack: { paddingHorizontal: theme.spacing.lg, paddingTop: theme.spacing.md },
    loadingContent: {
      alignSelf: 'center',
      gap: theme.spacing.lg,
      maxWidth: theme.sizes.contentMaxWidth,
      padding: theme.spacing.lg,
      width: '100%',
    },
    heading: { gap: theme.spacing.sm },
    statusPill: {
      alignSelf: 'flex-start',
      borderRadius: theme.radii.full,
      paddingHorizontal: theme.spacing.sm,
      paddingVertical: theme.spacing.xxs,
    },
    summary: { gap: theme.spacing.md },
    detailRow: { alignItems: 'center', flexDirection: 'row', gap: theme.spacing.sm },
    flexText: { flex: 1 },
    notice: { alignItems: 'flex-start', flexDirection: 'row', gap: theme.spacing.sm },
    actions: { gap: theme.spacing.sm },
    confirmation: { gap: theme.spacing.sm },
    inlineActions: { gap: theme.spacing.xs },
    reschedule: { gap: theme.spacing.sm },
  });
}
