import { useEffect, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText, Button, DecorativeIcon, Surface } from '@/components/ui';
import type { Appointment } from '@/features/appointments/domain/types';
import type { Provider } from '@/features/care/domain/types';
import { triggerHaptic } from '@/services/haptics/haptics';
import { useAppTheme, type AppTheme } from '@/theme';

export function BookingConfirmationScreen({
  appointment,
  onFindCare,
  onViewAppointments,
  provider,
}: {
  appointment: Appointment;
  onFindCare: () => void;
  onViewAppointments: () => void;
  provider: Provider | null;
}) {
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  useEffect(() => {
    void triggerHaptic('success');
  }, []);

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
      <View style={styles.content}>
        <View accessibilityElementsHidden importantForAccessibility="no" style={styles.icon}>
          <DecorativeIcon color={theme.colors.textInverse} name="checkmark" size={34} />
        </View>
        <View style={styles.heading}>
          <AppText accessibilityRole="header" style={styles.centered} variant="titleLarge">
            Appointment confirmed
          </AppText>
          <AppText style={styles.centered} tone="secondary" variant="bodyLarge">
            Your time is reserved and available from the Appointments tab.
          </AppText>
        </View>

        <Surface padding="spacious" style={styles.card} variant="brand">
          <AppText variant="titleSmall">{provider?.displayName ?? 'Confirmed provider'}</AppText>
          <AppText variant="bodyStrong">{formatAppointment(appointment)}</AppText>
          <AppText tone="secondary" variant="bodyMedium">
            {appointment.visitMode === 'video' ? 'Video visit' : 'In-person visit'} ·{' '}
            {appointment.timezone}
          </AppText>
          <AppText selectable tone="secondary" variant="caption">
            Reference {appointment.id.slice(-10).toUpperCase()}
          </AppText>
        </Surface>

        <View style={styles.actions}>
          <Button onPress={onViewAppointments}>View appointments</Button>
          <Button onPress={onFindCare} variant="secondary">
            Find another clinician
          </Button>
        </View>
      </View>
    </SafeAreaView>
  );
}

function formatAppointment(appointment: Appointment) {
  return new Intl.DateTimeFormat('en-AE', {
    dateStyle: 'full',
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
      flex: 1,
      gap: theme.spacing.lg,
      justifyContent: 'center',
      maxWidth: theme.sizes.contentMaxWidth,
      padding: theme.spacing.lg,
      width: '100%',
    },
    icon: {
      alignItems: 'center',
      alignSelf: 'center',
      backgroundColor: theme.colors.success,
      borderRadius: theme.radii.full,
      height: 72,
      justifyContent: 'center',
      width: 72,
    },
    heading: {
      gap: theme.spacing.xs,
    },
    centered: {
      textAlign: 'center',
    },
    card: {
      gap: theme.spacing.sm,
    },
    actions: {
      gap: theme.spacing.sm,
    },
  });
}
