import { useMemo } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText, Button, DecorativeIcon, EmptyState, Skeleton, Surface } from '@/components/ui';
import { useAuthSession } from '@/features/auth/context/auth-session-provider';
import { useAppTheme, type AppTheme } from '@/theme';

import { useAppointments } from '../hooks/use-appointments';
import type { Appointment } from '../domain/types';

export function AppointmentsScreen({
  onFindCare,
  onSignIn,
}: {
  onFindCare: () => void;
  onSignIn: () => void;
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

  return <AuthenticatedAppointments onFindCare={onFindCare} />;
}

function AuthenticatedAppointments({ onFindCare }: { onFindCare: () => void }) {
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const appointmentsQuery = useAppointments();

  if (appointmentsQuery.isPending) {
    return (
      <SafeAreaView
        accessibilityLabel="Loading appointments"
        edges={['top']}
        style={styles.safeArea}
      >
        <View style={styles.content}>
          <Skeleton height={38} width="60%" />
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

  if (appointmentsQuery.data.length === 0) {
    return (
      <AppointmentState
        action={<Button onPress={onFindCare}>Find a clinician</Button>}
        description="Choose a fictional provider and a real available slot to test the booking flow."
        title="No appointments yet"
      />
    );
  }

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.heading}>
          <AppText accessibilityRole="header" variant="titleLarge">
            Appointments
          </AppText>
          <AppText tone="secondary" variant="bodyLarge">
            Upcoming confirmed visits for this account.
          </AppText>
        </View>
        {appointmentsQuery.data.map(({ appointment, provider }) => (
          <AppointmentCard
            appointment={appointment}
            key={appointment.id}
            providerName={provider?.displayName ?? 'Provider'}
          />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

function AppointmentCard({
  appointment,
  providerName,
}: {
  appointment: Appointment;
  providerName: string;
}) {
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <Surface padding="spacious" style={styles.card} variant="raised">
      <View style={styles.statusRow}>
        <View style={styles.statusDot} />
        <AppText tone="success" variant="labelSmall">
          CONFIRMED
        </AppText>
      </View>
      <AppText variant="titleSmall">{providerName}</AppText>
      <View style={styles.detailRow}>
        <DecorativeIcon color={theme.colors.brand} name="calendar-outline" size={20} />
        <AppText variant="bodyStrong">{formatAppointment(appointment)}</AppText>
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

function formatAppointment(appointment: Appointment) {
  return new Intl.DateTimeFormat('en-AE', {
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
    card: {
      gap: theme.spacing.sm,
    },
    statusRow: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: theme.spacing.xs,
    },
    statusDot: {
      backgroundColor: theme.colors.success,
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
