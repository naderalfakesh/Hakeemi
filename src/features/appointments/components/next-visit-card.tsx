import { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText, DecorativeIcon } from '@/components/ui';
import { useAppLocale } from '@/localization/locale-provider';
import { useStrings } from '@/localization/use-strings';
import { useAppTheme, type AppTheme } from '@/theme';

import type { Appointment } from '../domain/types';
import { appointmentStatusStrings } from '../localization/appointment-status-strings';
import { daysUntil, formatAppointmentTime } from '../localization/format-appointment-time';
import { nextVisitStrings } from '../localization/next-visit-strings';

/** The patient's soonest confirmed visit, one tap away from its details. */
export function NextVisitCard({
  appointment,
  onPress,
  providerName,
}: {
  appointment: Appointment;
  onPress: () => void;
  providerName: string;
}) {
  const theme = useAppTheme();
  const { intlLocale } = useAppLocale();
  const strings = useStrings(nextVisitStrings);
  const statusStrings = useStrings(appointmentStatusStrings);
  const styles = useMemo(() => createStyles(theme), [theme]);
  const when = strings.when(daysUntil(appointment.startsAt));

  return (
    <Pressable
      accessibilityHint={strings.openHint}
      accessibilityLabel={strings.accessibilityLabel(
        providerName,
        when,
        formatAppointmentTime(appointment, intlLocale),
      )}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View style={styles.topRow}>
        <View style={styles.pill}>
          <AppText style={styles.pillText} variant="labelSmall">
            {strings.title}
          </AppText>
        </View>
        <AppText style={styles.when} variant="labelLarge">
          {when}
        </AppText>
      </View>
      <AppText numberOfLines={1} tone="inverse" variant="titleMedium">
        {providerName}
      </AppText>
      <View style={styles.detailRow}>
        <DecorativeIcon color={theme.colors.textInverse} name="time-outline" size={18} />
        <AppText tone="inverse" variant="bodyStrong">
          {formatAppointmentTime(appointment, intlLocale)}
        </AppText>
      </View>
      <View style={styles.detailRow}>
        <DecorativeIcon
          color={theme.colors.textInverse}
          name={appointment.visitMode === 'video' ? 'videocam-outline' : 'location-outline'}
          size={18}
        />
        <AppText style={styles.secondary} variant="bodyMedium">
          {statusStrings.visitModeLabels[appointment.visitMode]}
        </AppText>
        <View style={styles.spacer} />
        <DecorativeIcon color={theme.colors.textInverse} name="chevron-forward" size={20} />
      </View>
    </Pressable>
  );
}

function createStyles(theme: AppTheme) {
  return StyleSheet.create({
    card: {
      ...theme.shadows.raised,
      backgroundColor: theme.colors.brand,
      borderCurve: 'continuous',
      borderRadius: theme.radii.lg,
      gap: theme.spacing.xs,
      padding: theme.spacing.lg,
    },
    pressed: {
      backgroundColor: theme.colors.brandPressed,
      transform: [{ scale: 0.99 }],
    },
    topRow: {
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: theme.spacing.xxs,
    },
    pill: {
      // A tint of the card's own text color reads on both the light-mode
      // teal and the pale dark-mode teal.
      backgroundColor:
        theme.mode === 'dark' ? 'rgba(6, 36, 33, 0.12)' : 'rgba(255, 255, 255, 0.18)',
      borderRadius: theme.radii.full,
      paddingHorizontal: theme.spacing.sm,
      paddingVertical: theme.spacing.xxs,
    },
    pillText: {
      color: theme.colors.textInverse,
    },
    when: {
      color: theme.colors.textInverse,
      opacity: 0.9,
    },
    detailRow: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: theme.spacing.xs,
    },
    secondary: {
      color: theme.colors.textInverse,
      opacity: 0.86,
    },
    spacer: {
      flex: 1,
    },
  });
}
