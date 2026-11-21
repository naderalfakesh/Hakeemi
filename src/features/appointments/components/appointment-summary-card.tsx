import { StyleSheet } from 'react-native';

import { AppText, Surface } from '@/components/ui';
import { formatTimeZoneName } from '@/localization/format';
import { useAppLocale } from '@/localization/locale-provider';
import { useStrings } from '@/localization/use-strings';
import { useThemedStyles, type AppTheme } from '@/theme';

import { formatAppointmentReference } from '../domain/reference';
import type { Appointment } from '../domain/types';
import { appointmentDetailStrings } from '../localization/appointment-detail-strings';
import { appointmentStatusStrings } from '../localization/appointment-status-strings';
import { formatAppointmentDateTime } from '../localization/format-appointment-time';
import { AppointmentDetailRow } from './appointment-detail-row';

export function AppointmentSummaryCard({ appointment }: { appointment: Appointment }) {
  const { intlLocale, locale } = useAppLocale();
  const strings = useStrings(appointmentDetailStrings);
  const statusStrings = useStrings(appointmentStatusStrings);
  const styles = useThemedStyles(createStyles);

  return (
    <Surface padding="spacious" style={styles.summary} variant="brand">
      <AppointmentDetailRow
        icon="calendar-outline"
        label={formatAppointmentDateTime(appointment, intlLocale)}
        tone="primary"
      />
      <AppointmentDetailRow
        icon={appointment.visitMode === 'video' ? 'videocam-outline' : 'location-outline'}
        label={`${statusStrings.visitModeLabels[appointment.visitMode]} · ${formatTimeZoneName(
          appointment.timezone,
          locale,
          appointment.startsAt,
        )}`}
      />
      <AppText selectable tone="secondary" variant="caption">
        {strings.reference(formatAppointmentReference(appointment.id))}
      </AppText>
    </Surface>
  );
}

function createStyles(theme: AppTheme) {
  return StyleSheet.create({
    summary: { gap: theme.spacing.md },
  });
}
