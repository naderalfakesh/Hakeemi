import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui';
import { useStrings } from '@/localization/use-strings';
import { useAppTheme, useThemedStyles, type AppTheme } from '@/theme';

import type { Appointment } from '../domain/types';
import { appointmentStatusStrings } from '../localization/appointment-status-strings';

export function AppointmentStatusPill({ appointment }: { appointment: Appointment }) {
  const theme = useAppTheme();
  const statusStrings = useStrings(appointmentStatusStrings);
  const styles = useThemedStyles(createStyles);
  const palette = statusPillPalette(theme, appointment);
  return (
    <View style={[styles.statusPill, { backgroundColor: palette.background }]}>
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

function createStyles(theme: AppTheme) {
  return StyleSheet.create({
    statusPill: {
      alignSelf: 'flex-start',
      borderRadius: theme.radii.full,
      paddingHorizontal: theme.spacing.sm,
      paddingVertical: theme.spacing.xxs,
    },
  });
}
