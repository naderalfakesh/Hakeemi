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
  StaleDataNotice,
  Surface,
} from '@/components/ui';
import { useAuthSession } from '@/features/auth/context/auth-session-provider';
import type { CareRepository } from '@/features/care/domain/repository';
import { useAppLocale } from '@/localization/locale-provider';
import { useStrings } from '@/localization/use-strings';
import { useIsOffline } from '@/services/connectivity/use-is-offline';
import { useAppTheme, type AppTheme } from '@/theme';

import type { AppointmentRepository } from '../domain/repository';
import {
  selectAppointments,
  useAppointments,
  type AppointmentFilter,
} from '../hooks/use-appointments';
import type { Appointment } from '../domain/types';
import { appointmentStatusStrings } from '../localization/appointment-status-strings';
import { appointmentsStrings } from '../localization/appointments-strings';

const filterKeys: readonly AppointmentFilter[] = ['upcoming', 'past', 'cancelled'];

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
  const strings = useStrings(appointmentsStrings);

  if (session.status !== 'authenticated') {
    return (
      <AppointmentState
        action={<Button onPress={onSignIn}>{strings.signIn}</Button>}
        description={strings.signInDescription}
        title={strings.signInTitle}
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
  const { locale } = useAppLocale();
  const strings = useStrings(appointmentsStrings);
  const styles = useMemo(() => createStyles(theme), [theme]);
  const appointmentsQuery = useAppointments(appointmentRepository, careDataRepository);
  const isOffline = useIsOffline();
  const [filter, setFilter] = useState<AppointmentFilter>('upcoming');

  if (appointmentsQuery.isPending) {
    return (
      <SafeAreaView
        accessibilityLabel={strings.loadingAppointments}
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

  if (appointmentsQuery.isError && appointmentsQuery.data === undefined) {
    return (
      <AppointmentState
        action={
          <Button onPress={() => void appointmentsQuery.refetch()}>{strings.tryAgain}</Button>
        }
        description={strings.errorDescription}
        title={strings.errorTitle}
      />
    );
  }

  const staleReason = isOffline ? 'offline' : appointmentsQuery.isError ? 'refresh-failed' : null;
  const visibleAppointments = selectAppointments(appointmentsQuery.data ?? [], filter);

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.heading}>
          <AppText accessibilityRole="header" variant="titleLarge">
            {strings.title}
          </AppText>
          <AppText tone="secondary" variant="bodyLarge">
            {strings.subtitle}
          </AppText>
        </View>

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
            action={<Button onPress={onFindCare}>{strings.findClinician}</Button>}
            description={strings.emptyDescriptions[filter]}
            icon={
              <DecorativeIcon
                color={theme.colors.brand}
                name={filter === 'cancelled' ? 'close-circle-outline' : 'calendar-outline'}
                size={34}
              />
            }
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
  const strings = useStrings(appointmentsStrings);
  const statusStrings = useStrings(appointmentStatusStrings);
  const styles = useMemo(() => createStyles(theme), [theme]);
  const statusTone = appointment.status === 'confirmed' ? 'success' : 'secondary';

  return (
    <Pressable
      accessibilityLabel={strings.openAppointmentWith(providerName)}
      accessibilityRole={onPress ? 'button' : undefined}
      disabled={!onPress}
      onPress={onPress}
      style={({ pressed }) => [styles.cardPressable, pressed && styles.cardPressed]}
    >
      <Surface padding="spacious" style={styles.card} variant="raised">
        <View style={styles.statusRow}>
          <View style={[styles.statusDot, { backgroundColor: statusColor(theme, appointment) }]} />
          <AppText tone={statusTone} variant="labelSmall">
            {statusStrings.statusLabels[appointment.status]}
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
            {statusStrings.visitModeLabels[appointment.visitMode]} · {appointment.timezone}
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
