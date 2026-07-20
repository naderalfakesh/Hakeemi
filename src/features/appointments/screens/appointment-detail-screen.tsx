import * as Crypto from 'expo-crypto';
import { useMemo, useState } from 'react';
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
import type { CareRepository } from '@/features/care/domain/repository';
import { careRepository } from '@/features/care/data/care-repository';
import { formatAvailability } from '@/features/care/presentation/formatters';
import { useProviderDetail } from '@/features/care/hooks/use-provider-detail';
import { useAppLocale } from '@/localization/locale-provider';
import { useStrings } from '@/localization/use-strings';
import { addAppointmentToCalendar } from '@/services/calendar/calendar';
import { triggerHaptic } from '@/services/haptics/haptics';
import { useAppTheme, type AppTheme } from '@/theme';

import { useCancelAppointment } from '../hooks/use-cancel-appointment';
import { useAppointmentDetail } from '../hooks/use-appointment-detail';
import { useRescheduleAppointment } from '../hooks/use-reschedule-appointment';
import type { AppointmentRepository } from '../domain/repository';
import type { Appointment } from '../domain/types';
import { appointmentDetailStrings } from '../localization/appointment-detail-strings';
import { appointmentStatusStrings } from '../localization/appointment-status-strings';
import { localizeAppointmentError } from '../localization/appointment-error-strings';

export function AppointmentDetailScreen({
  appointmentId,
  appointmentRepository,
  careDataRepository = careRepository,
  createRequestId = Crypto.randomUUID,
  onBack,
  onFindCare,
}: {
  appointmentId: string;
  appointmentRepository?: AppointmentRepository | undefined;
  careDataRepository?: CareRepository;
  createRequestId?: () => string;
  onBack: () => void;
  onFindCare: () => void;
}) {
  const session = useAuthSession();
  const strings = useStrings(appointmentDetailStrings);

  if (session.status !== 'authenticated') {
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
      appointmentId={appointmentId}
      appointmentRepository={appointmentRepository}
      careDataRepository={careDataRepository}
      createRequestId={createRequestId}
      onBack={onBack}
      onFindCare={onFindCare}
    />
  );
}

function AuthenticatedAppointmentDetail({
  appointmentId,
  appointmentRepository,
  careDataRepository,
  createRequestId,
  onBack,
  onFindCare,
}: {
  appointmentId: string;
  appointmentRepository?: AppointmentRepository | undefined;
  careDataRepository: CareRepository;
  createRequestId: () => string;
  onBack: () => void;
  onFindCare: () => void;
}) {
  const theme = useAppTheme();
  const { intlLocale, locale } = useAppLocale();
  const strings = useStrings(appointmentDetailStrings);
  const statusStrings = useStrings(appointmentStatusStrings);
  const styles = useMemo(() => createStyles(theme), [theme]);
  const detailQuery = useAppointmentDetail(appointmentId, appointmentRepository);
  const providerId = detailQuery.data?.providerId ?? '';
  const providerQuery = useProviderDetail(providerId, careDataRepository);
  const cancelMutation = useCancelAppointment({ repository: appointmentRepository });
  const rescheduleMutation = useRescheduleAppointment({ repository: appointmentRepository });
  const [confirmingCancel, setConfirmingCancel] = useState(false);
  const [showReschedule, setShowReschedule] = useState(false);
  const [calendarState, setCalendarState] = useState<CalendarState>({ status: 'idle' });

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

  const providerName =
    providerQuery.state.status === 'success'
      ? providerQuery.state.data.provider.displayName[locale]
      : appointment.providerId;
  const canManage =
    appointment.status === 'confirmed' && new Date(appointment.startsAt) > new Date();
  const actionError = cancelMutation.error ?? rescheduleMutation.error;

  async function addToCalendar() {
    setCalendarState({ status: 'adding' });

    try {
      const result = await addAppointmentToCalendar({
        endsAt: appointmentRecord.endsAt,
        providerName,
        startsAt: appointmentRecord.startsAt,
        timezone: appointmentRecord.timezone,
        visitMode: appointmentRecord.visitMode,
      });

      setCalendarState(result.status === 'added' ? { status: 'added' } : result);
    } catch {
      setCalendarState({ status: 'error' });
    }
  }

  async function cancel() {
    await cancelMutation.cancel({
      appointmentId: appointmentRecord.id,
      requestId: createRequestId(),
    });
    setConfirmingCancel(false);
  }

  async function confirmCancel() {
    await triggerHaptic('warning');
    await cancel();
  }

  async function reschedule(slotId: string) {
    await rescheduleMutation.reschedule({
      appointmentId: appointmentRecord.id,
      requestId: createRequestId(),
      slotId,
    });
    setShowReschedule(false);
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
          <AppText accessibilityRole="header" variant="titleLarge">
            {providerName}
          </AppText>
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
            label={`${statusStrings.visitModeLabels[appointment.visitMode]} · ${appointment.timezone}`}
          />
          <AppText selectable tone="secondary" variant="caption">
            {strings.reference(appointment.id.slice(-10).toUpperCase())}
          </AppText>
        </Surface>

        {appointment.status === 'confirmed' && (
          <View style={styles.calendarSection}>
            <Button
              accessibilityLabel={
                calendarState.status === 'added' ? strings.addedToCalendar : strings.addToCalendar
              }
              busy={calendarState.status === 'adding'}
              disabled={calendarState.status === 'added'}
              leading={
                <DecorativeIcon color={theme.colors.brand} name="calendar-outline" size={18} />
              }
              onPress={() => void addToCalendar()}
              variant="secondary"
            >
              {calendarState.status === 'added' ? strings.addedToCalendar : strings.addToCalendar}
            </Button>
            {calendarState.status === 'denied' && (
              <AppText tone="secondary" variant="caption">
                {strings.calendarDenied}
              </AppText>
            )}
            {calendarState.status === 'unavailable' && (
              <AppText tone="secondary" variant="caption">
                {strings.calendarUnavailable}
              </AppText>
            )}
            {calendarState.status === 'error' && (
              <AppText tone="danger" variant="caption">
                {strings.calendarError}
              </AppText>
            )}
          </View>
        )}

        {appointment.status === 'cancelled' && appointment.cancelledAt && (
          <Surface padding="compact" style={styles.notice} variant="muted">
            <DecorativeIcon color={theme.colors.warning} name="information-circle" size={20} />
            <AppText tone="secondary" variant="bodyMedium">
              {strings.cancelledOn(formatDate(appointment.cancelledAt, intlLocale))}
            </AppText>
          </Surface>
        )}

        {canManage && (
          <View style={styles.actions}>
            <Button
              onPress={() => {
                setConfirmingCancel(false);
                setShowReschedule((visible) => !visible);
              }}
              variant="secondary"
            >
              {showReschedule ? strings.keepCurrentTime : strings.reschedule}
            </Button>
            <Button
              accessibilityHint={strings.cancelAppointmentHint}
              onPress={() => setConfirmingCancel((visible) => !visible)}
              variant="danger"
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
              <Button onPress={() => setConfirmingCancel(false)} variant="tertiary">
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
          <RescheduleSection
            currentSlotId={appointment.slotId}
            onSelect={(slotId) => void reschedule(slotId)}
            providerState={providerQuery.state}
            submitting={rescheduleMutation.status === 'pending'}
          />
        )}

        {actionError && <InlineError message={localizeAppointmentError(actionError, locale)} />}

        {!canManage && appointment.status !== 'cancelled' && (
          <Surface padding="compact" variant="muted">
            <AppText tone="secondary" variant="bodyMedium">
              {strings.historyNotice}
            </AppText>
          </Surface>
        )}

        <Button onPress={onFindCare} variant="tertiary">
          {strings.findAnotherClinician}
        </Button>
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
  const statusStrings = useStrings(appointmentStatusStrings);
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

  const slots = providerState.data.slots.filter((slot) => slot.id !== currentSlotId).slice(0, 6);

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
        <View style={styles.slotList}>
          {slots.map((slot) => (
            <View key={slot.id} style={styles.slotRow}>
              <View style={styles.slotCopy}>
                <AppText variant="bodyStrong">{formatAvailability(slot, locale)}</AppText>
                <AppText tone="secondary" variant="caption">
                  {statusStrings.visitModeLabels[slot.visitMode]} · {slot.timezone}
                </AppText>
              </View>
              <Button
                accessibilityHint={strings.moveHereHint}
                busy={submitting}
                disabled={submitting}
                onPress={() => onSelect(slot.id)}
                variant="secondary"
              >
                {strings.moveHere}
              </Button>
            </View>
          ))}
        </View>
      )}
    </Surface>
  );
}

function StatusPill({ appointment }: { appointment: Appointment }) {
  const theme = useAppTheme();
  const statusStrings = useStrings(appointmentStatusStrings);
  return (
    <View
      style={[createStyles(theme).statusPill, { backgroundColor: statusColor(theme, appointment) }]}
    >
      <AppText tone="inverse" variant="labelSmall">
        {statusStrings.statusLabels[appointment.status]}
      </AppText>
    </View>
  );
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
      <AppText tone={tone} variant="bodyMedium">
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

type CalendarState = { status: 'idle' | 'adding' | 'added' | 'denied' | 'unavailable' | 'error' };

function statusColor(theme: AppTheme, appointment: Appointment) {
  if (appointment.status === 'confirmed') {
    return theme.colors.success;
  }
  return appointment.status === 'cancelled' ? theme.colors.warning : theme.colors.textSecondary;
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
    calendarSection: { gap: theme.spacing.xs },
    detailRow: { alignItems: 'center', flexDirection: 'row', gap: theme.spacing.sm },
    notice: { alignItems: 'flex-start', flexDirection: 'row', gap: theme.spacing.sm },
    actions: { gap: theme.spacing.sm },
    confirmation: { gap: theme.spacing.sm },
    inlineActions: { gap: theme.spacing.xs },
    reschedule: { gap: theme.spacing.sm },
    slotList: { gap: theme.spacing.sm, marginTop: theme.spacing.xs },
    slotRow: {
      alignItems: 'center',
      backgroundColor: theme.colors.surfaceMuted,
      borderRadius: theme.radii.md,
      flexDirection: 'row',
      gap: theme.spacing.sm,
      justifyContent: 'space-between',
      padding: theme.spacing.sm,
    },
    slotCopy: { flex: 1, gap: theme.spacing.xxs },
  });
}
