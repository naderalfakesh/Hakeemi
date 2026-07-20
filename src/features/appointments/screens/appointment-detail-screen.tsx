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
  Surface,
} from '@/components/ui';
import { useAuthSession } from '@/features/auth/context/auth-session-provider';
import type { CareRepository } from '@/features/care/domain/repository';
import { careRepository } from '@/features/care/data/care-repository';
import { formatAvailability } from '@/features/care/presentation/formatters';
import { useProviderDetail } from '@/features/care/hooks/use-provider-detail';
import { useAppTheme, type AppTheme } from '@/theme';

import { useCancelAppointment } from '../hooks/use-cancel-appointment';
import { useAppointmentDetail } from '../hooks/use-appointment-detail';
import { useRescheduleAppointment } from '../hooks/use-reschedule-appointment';
import type { AppointmentRepository } from '../domain/repository';
import type { Appointment } from '../domain/types';

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

  if (session.status !== 'authenticated') {
    return (
      <DetailState
        action={<Button onPress={onBack}>Back to appointments</Button>}
        description="Sign in to access private appointment details."
        onBack={onBack}
        title="Sign in to continue"
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
  const styles = useMemo(() => createStyles(theme), [theme]);
  const detailQuery = useAppointmentDetail(appointmentId, appointmentRepository);
  const providerId = detailQuery.data?.providerId ?? '';
  const providerQuery = useProviderDetail(providerId, careDataRepository);
  const cancelMutation = useCancelAppointment({ repository: appointmentRepository });
  const rescheduleMutation = useRescheduleAppointment({ repository: appointmentRepository });
  const [confirmingCancel, setConfirmingCancel] = useState(false);
  const [showReschedule, setShowReschedule] = useState(false);

  if (detailQuery.isPending) {
    return <DetailLoading />;
  }

  if (detailQuery.isError) {
    return (
      <DetailState
        action={<Button onPress={() => void detailQuery.refetch()}>Try again</Button>}
        description="Check your connection and try again."
        onBack={onBack}
        title="Appointment unavailable"
      />
    );
  }

  const appointment = detailQuery.data;

  if (!appointment) {
    return (
      <DetailState
        action={<Button onPress={onBack}>Back to appointments</Button>}
        description="This appointment may have been removed or is not owned by this account."
        onBack={onBack}
        title="Appointment not found"
      />
    );
  }

  const appointmentRecord = appointment;

  const providerName =
    providerQuery.state.status === 'success'
      ? providerQuery.state.data.provider.displayName
      : appointment.providerId;
  const canManage =
    appointment.status === 'confirmed' && new Date(appointment.startsAt) > new Date();
  const actionError = cancelMutation.error ?? rescheduleMutation.error;

  async function cancel() {
    await cancelMutation.cancel({
      appointmentId: appointmentRecord.id,
      requestId: createRequestId(),
    });
    setConfirmingCancel(false);
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
          <IconButton accessibilityLabel="Back to appointments" onPress={onBack} variant="soft">
            <DecorativeIcon color={theme.colors.brand} name="arrow-back" size={22} />
          </IconButton>
          <AppText tone="secondary" variant="labelLarge">
            Appointment details
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
            label={formatAppointment(appointment)}
            tone="primary"
          />
          <DetailRow
            icon={appointment.visitMode === 'video' ? 'videocam-outline' : 'location-outline'}
            label={`${appointment.visitMode === 'video' ? 'Video visit' : 'In-person visit'} · ${appointment.timezone}`}
          />
          <AppText selectable tone="secondary" variant="caption">
            Reference {appointment.id.slice(-10).toUpperCase()}
          </AppText>
        </Surface>

        {appointment.status === 'cancelled' && appointment.cancelledAt && (
          <Surface padding="compact" style={styles.notice} variant="muted">
            <DecorativeIcon color={theme.colors.warning} name="information-circle" size={20} />
            <AppText tone="secondary" variant="bodyMedium">
              Cancelled on {formatDate(appointment.cancelledAt)}. You can choose a new visit from
              Find care.
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
              {showReschedule ? 'Keep current time' : 'Reschedule'}
            </Button>
            <Button onPress={() => setConfirmingCancel((visible) => !visible)} variant="danger">
              Cancel appointment
            </Button>
          </View>
        )}

        {confirmingCancel && canManage && (
          <Surface padding="spacious" style={styles.confirmation} variant="muted">
            <AppText variant="titleSmall">Cancel this appointment?</AppText>
            <AppText tone="secondary" variant="bodyMedium">
              This releases the time for another patient. Cancellation is final, but you can book a
              new visit at any time.
            </AppText>
            <View style={styles.inlineActions}>
              <Button onPress={() => setConfirmingCancel(false)} variant="tertiary">
                Keep appointment
              </Button>
              <Button
                busy={cancelMutation.status === 'pending'}
                onPress={() => void cancel()}
                variant="danger"
              >
                Confirm cancellation
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

        {actionError && <InlineError message={actionError.message} />}

        {!canManage && appointment.status !== 'cancelled' && (
          <Surface padding="compact" variant="muted">
            <AppText tone="secondary" variant="bodyMedium">
              This visit is in your history and can no longer be changed.
            </AppText>
          </Surface>
        )}

        <Button onPress={onFindCare} variant="tertiary">
          Find another clinician
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
          New times could not be loaded. Try again in a moment.
        </AppText>
      </Surface>
    );
  }

  const slots = providerState.data.slots.filter((slot) => slot.id !== currentSlotId).slice(0, 6);

  return (
    <Surface padding="spacious" style={styles.reschedule} variant="plain">
      <AppText variant="titleSmall">Choose a new time</AppText>
      <AppText tone="secondary" variant="bodyMedium">
        Select another available time with the same clinician. Your current appointment stays in
        place until the change succeeds.
      </AppText>
      {slots.length === 0 ? (
        <AppText tone="secondary" variant="bodyMedium">
          No other times are available in the next 14 days.
        </AppText>
      ) : (
        <View style={styles.slotList}>
          {slots.map((slot) => (
            <View key={slot.id} style={styles.slotRow}>
              <View style={styles.slotCopy}>
                <AppText variant="bodyStrong">{formatAvailability(slot)}</AppText>
                <AppText tone="secondary" variant="caption">
                  {slot.visitMode === 'video' ? 'Video visit' : 'In-person visit'} · {slot.timezone}
                </AppText>
              </View>
              <Button
                busy={submitting}
                disabled={submitting}
                onPress={() => onSelect(slot.id)}
                variant="secondary"
              >
                Move here
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
  return (
    <View
      style={[createStyles(theme).statusPill, { backgroundColor: statusColor(theme, appointment) }]}
    >
      <AppText tone="inverse" variant="labelSmall">
        {statusLabel(appointment.status)}
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
  const styles = useMemo(() => createStyles(theme), [theme]);
  return (
    <SafeAreaView accessibilityLabel="Loading appointment" edges={['top']} style={styles.safeArea}>
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
  const styles = useMemo(() => createStyles(theme), [theme]);
  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
      <View style={styles.stateBack}>
        <IconButton accessibilityLabel="Back to appointments" onPress={onBack} variant="soft">
          <DecorativeIcon color={theme.colors.brand} name="arrow-back" size={22} />
        </IconButton>
      </View>
      <EmptyState
        action={action}
        description={description}
        icon={<DecorativeIcon color={theme.colors.brand} name="calendar-outline" size={34} />}
        title={title}
      />
    </SafeAreaView>
  );
}

function statusLabel(status: Appointment['status']) {
  return status === 'no_show' ? 'NO SHOW' : status.replace('_', ' ').toUpperCase();
}

function statusColor(theme: AppTheme, appointment: Appointment) {
  if (appointment.status === 'confirmed') {
    return theme.colors.success;
  }
  return appointment.status === 'cancelled' ? theme.colors.warning : theme.colors.textSecondary;
}

function formatAppointment(appointment: Appointment) {
  return new Intl.DateTimeFormat('en-AE', {
    dateStyle: 'full',
    timeStyle: 'short',
    timeZone: appointment.timezone,
  }).format(new Date(appointment.startsAt));
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en-AE', { dateStyle: 'medium' }).format(new Date(value));
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
