import { Pressable, StyleSheet, View } from 'react-native';

import { AppText, DecorativeIcon, Surface } from '@/components/ui';
import { formatTimeZoneName } from '@/localization/format';
import { useAppLocale } from '@/localization/locale-provider';
import { useStrings } from '@/localization/use-strings';
import { useAppTheme, useThemedStyles, type AppTheme } from '@/theme';

import type { Appointment } from '../domain/types';
import { formatAppointmentTime } from '../localization/format-appointment-time';
import { appointmentStatusStrings } from '../localization/appointment-status-strings';
import { appointmentsStrings } from '../localization/appointments-strings';

type AppointmentCardProps = {
  appointment: Appointment;
  onPress?: (() => void) | undefined;
  providerName: string;
};

export function AppointmentCard({ appointment, onPress, providerName }: AppointmentCardProps) {
  const theme = useAppTheme();
  const { intlLocale, locale } = useAppLocale();
  const strings = useStrings(appointmentsStrings);
  const statusStrings = useStrings(appointmentStatusStrings);
  const styles = useThemedStyles(createStyles);
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
            <View style={styles.statusChevron}>
              <DecorativeIcon color={theme.colors.textSecondary} name="chevron-forward" size={17} />
            </View>
          )}
        </View>
        <AppText variant="titleSmall">{providerName}</AppText>
        <View style={styles.detailRow}>
          <DecorativeIcon color={theme.colors.brand} name="calendar-outline" size={20} />
          <AppText style={styles.detailText} variant="bodyStrong">
            {formatAppointmentTime(appointment, intlLocale)}
          </AppText>
        </View>
        <View style={styles.detailRow}>
          <DecorativeIcon
            color={theme.colors.brand}
            name={appointment.visitMode === 'video' ? 'videocam-outline' : 'location-outline'}
            size={20}
          />
          <AppText style={styles.detailText} tone="secondary" variant="bodyMedium">
            {statusStrings.visitModeLabels[appointment.visitMode]} ·{' '}
            {formatTimeZoneName(appointment.timezone, locale, appointment.startsAt)}
          </AppText>
        </View>
      </Surface>
    </Pressable>
  );
}

function statusColor(theme: AppTheme, appointment: Appointment) {
  if (appointment.status === 'confirmed') {
    return theme.colors.success;
  }

  return appointment.status === 'cancelled' ? theme.colors.warning : theme.colors.textSecondary;
}

function createStyles(theme: AppTheme) {
  return StyleSheet.create({
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
    statusChevron: {
      marginStart: 'auto',
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
    detailText: {
      flex: 1,
    },
  });
}
