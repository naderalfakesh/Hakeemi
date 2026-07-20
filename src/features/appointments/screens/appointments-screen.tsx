import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  AppText,
  Button,
  Chip,
  DecorativeIcon,
  EmptyState,
  Skeleton,
  Surface,
} from '@/components/ui';
import { useAuthSession } from '@/features/auth/context/auth-session-provider';
import type { CareRepository } from '@/features/care/domain/repository';
import { useAppLocale } from '@/localization/locale-provider';
import { useAppTheme, type AppTheme } from '@/theme';

import type { AppointmentRepository } from '../domain/repository';
import {
  selectAppointments,
  useAppointments,
  type AppointmentFilter,
} from '../hooks/use-appointments';
import type { Appointment } from '../domain/types';

const filters: readonly { key: AppointmentFilter; label: string }[] = [
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'past', label: 'Past' },
  { key: 'cancelled', label: 'Cancelled' },
];

export function AppointmentsScreen({
  onFindCare,
  appointmentRepository,
  careDataRepository,
  onSignIn,
  onViewAppointment,
}: {
  appointmentRepository?: AppointmentRepository | undefined;
  careDataRepository?: CareRepository | undefined;
  onFindCare: () => void;
  onSignIn: () => void;
  onViewAppointment?: ((appointmentId: string) => void) | undefined;
}) {
  const session = useAuthSession();

  if (session.status !== 'authenticated') {
    return (
      <AppointmentState
        action={<Button onPress={onSignIn}>Sign in</Button>}
        description="Sign in to view appointments saved to your account."
        title="Your appointments stay private"
      />
    );
  }

  return (
    <AuthenticatedAppointments
      appointmentRepository={appointmentRepository}
      careDataRepository={careDataRepository}
      onFindCare={onFindCare}
      onViewAppointment={onViewAppointment}
    />
  );
}

function AuthenticatedAppointments({
  appointmentRepository,
  careDataRepository,
  onFindCare,
  onViewAppointment,
}: {
  appointmentRepository?: AppointmentRepository | undefined;
  careDataRepository?: CareRepository | undefined;
  onFindCare: () => void;
  onViewAppointment?: ((appointmentId: string) => void) | undefined;
}) {
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const appointmentsQuery = useAppointments(appointmentRepository, careDataRepository);
  const [filter, setFilter] = useState<AppointmentFilter>('upcoming');

  if (appointmentsQuery.isPending) {
    return (
      <SafeAreaView
        accessibilityLabel="Loading appointments"
        edges={['top']}
        style={styles.safeArea}
      >
        <View style={styles.content}>
          <Skeleton height={38} width="60%" />
          <View style={styles.filterRow}>
            <Skeleton height={44} radius="sm" width={112} />
            <Skeleton height={44} radius="sm" width={92} />
          </View>
          <Skeleton height={150} radius="lg" width="100%" />
        </View>
      </SafeAreaView>
    );
  }

  if (appointmentsQuery.isError) {
    return (
      <AppointmentState
        action={<Button onPress={() => void appointmentsQuery.refetch()}>Try again</Button>}
        description="Your private appointment list could not be loaded."
        title="Appointments unavailable"
      />
    );
  }

  const visibleAppointments = selectAppointments(appointmentsQuery.data ?? [], filter);
  const filterLabel = filters.find((candidate) => candidate.key === filter)?.label ?? 'Upcoming';

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.heading}>
          <AppText accessibilityRole="header" variant="titleLarge">
            Appointments
          </AppText>
          <AppText tone="secondary" variant="bodyLarge">
            Keep upcoming care close and revisit your appointment history.
          </AppText>
        </View>

        <ScrollView
          contentContainerStyle={styles.filterRow}
          horizontal
          showsHorizontalScrollIndicator={false}
        >
          {filters.map((candidate) => (
            <Chip
              key={candidate.key}
              label={candidate.label}
              onPress={() => setFilter(candidate.key)}
              selected={candidate.key === filter}
            />
          ))}
        </ScrollView>

        {visibleAppointments.length === 0 ? (
          <EmptyState
            action={<Button onPress={onFindCare}>Find a clinician</Button>}
            description={emptyDescription(filter)}
            icon={
              <DecorativeIcon
                color={theme.colors.brand}
                name={filter === 'cancelled' ? 'close-circle-outline' : 'calendar-outline'}
                size={34}
              />
            }
            title={`No ${filterLabel.toLowerCase()} appointments`}
          />
        ) : (
          visibleAppointments.map(({ appointment, provider }) => (
            <AppointmentCard
              appointment={appointment}
              key={appointment.id}
              onPress={onViewAppointment ? () => onViewAppointment(appointment.id) : undefined}
              providerName={provider?.displayName ?? 'Provider'}
            />
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function AppointmentCard({
  appointment,
  onPress,
  providerName,
}: {
  appointment: Appointment;
  onPress?: (() => void) | undefined;
  providerName: string;
}) {
  const theme = useAppTheme();
  const { intlLocale } = useAppLocale();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const statusTone = appointment.status === 'confirmed' ? 'success' : 'secondary';

  return (
    <Pressable
      accessibilityLabel={`Open appointment with ${providerName}`}
      accessibilityRole={onPress ? 'button' : undefined}
      disabled={!onPress}
      onPress={onPress}
      style={({ pressed }) => [styles.cardPressable, pressed && styles.cardPressed]}
    >
      <Surface padding="spacious" style={styles.card} variant="raised">
        <View style={styles.statusRow}>
          <View style={[styles.statusDot, { backgroundColor: statusColor(theme, appointment) }]} />
          <AppText tone={statusTone} variant="labelSmall">
            {statusLabel(appointment.status)}
          </AppText>
          {onPress && (
            <DecorativeIcon color={theme.colors.textSecondary} name="chevron-forward" size={17} />
          )}
        </View>
        <AppText variant="titleSmall">{providerName}</AppText>
        <View style={styles.detailRow}>
          <DecorativeIcon color={theme.colors.brand} name="calendar-outline" size={20} />
          <AppText variant="bodyStrong">{formatAppointment(appointment, intlLocale)}</AppText>
        </View>
        <View style={styles.detailRow}>
          <DecorativeIcon
            color={theme.colors.brand}
            name={appointment.visitMode === 'video' ? 'videocam-outline' : 'location-outline'}
            size={20}
          />
          <AppText tone="secondary" variant="bodyMedium">
            {appointment.visitMode === 'video' ? 'Video visit' : 'In-person visit'} ·{' '}
            {appointment.timezone}
          </AppText>
        </View>
      </Surface>
    </Pressable>
  );
}

function AppointmentState({
  action,
  description,
  title,
}: {
  action: React.ReactNode;
  description: string;
  title: string;
}) {
  const theme = useAppTheme();

  return (
    <SafeAreaView edges={['top']} style={{ backgroundColor: theme.colors.canvas, flex: 1 }}>
      <EmptyState
        action={action}
        description={description}
        icon={<DecorativeIcon color={theme.colors.brand} name="calendar-outline" size={34} />}
        title={title}
      />
    </SafeAreaView>
  );
}

function emptyDescription(filter: AppointmentFilter) {
  if (filter === 'cancelled') {
    return 'Cancelled visits will stay here so your care history remains clear.';
  }

  if (filter === 'past') {
    return 'Completed visits and appointments you missed will appear here.';
  }

  return 'Choose a clinician and a real available slot to plan your next visit.';
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

function formatAppointment(appointment: Appointment, locale = 'en-AE') {
  return new Intl.DateTimeFormat(locale, {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: appointment.timezone,
  }).format(new Date(appointment.startsAt));
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
    heading: {
      gap: theme.spacing.xs,
      marginBottom: theme.spacing.sm,
    },
    filterRow: {
      gap: theme.spacing.xs,
      paddingBottom: theme.spacing.xxs,
    },
    cardPressable: {
      borderRadius: theme.radii.lg,
    },
    cardPressed: {
      opacity: 0.86,
      transform: [{ scale: 0.99 }],
    },
    card: {
      gap: theme.spacing.sm,
    },
    statusRow: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: theme.spacing.xs,
    },
    statusDot: {
      borderRadius: theme.radii.full,
      height: 8,
      width: 8,
    },
    detailRow: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: theme.spacing.sm,
    },
  });
}
