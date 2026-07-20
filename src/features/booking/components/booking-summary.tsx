import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText, DecorativeIcon, Surface } from '@/components/ui';
import { formatFee } from '@/features/care/presentation/formatters';
import { useAppTheme, type AppTheme } from '@/theme';

import type { BookingSelection } from '../hooks/use-booking-selection';
import { formatBookingSlot, formatReasonCategory } from '../presentation/formatters';
import type { AppointmentReasonCategory } from '@/features/appointments/domain/types';

export function BookingSummary({
  reasonCategory,
  selection,
  showReason = false,
}: {
  reasonCategory: AppointmentReasonCategory | null;
  selection: BookingSelection;
  showReason?: boolean;
}) {
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <Surface padding="spacious" style={styles.card} variant="raised">
      <SummaryRow icon="person-outline" label="Clinician" value={selection.provider.displayName} />
      <SummaryRow
        icon="time-outline"
        label="Appointment"
        value={formatBookingSlot(selection.slot)}
      />
      <SummaryRow
        icon={selection.slot.visitMode === 'video' ? 'videocam-outline' : 'location-outline'}
        label={selection.slot.visitMode === 'video' ? 'Visit mode' : 'Clinic'}
        value={selection.clinic?.name.en ?? 'Video visit'}
      />
      <SummaryRow
        icon="wallet-outline"
        label="Consultation"
        value={formatFee(selection.provider.consultationFee)}
      />
      {showReason && (
        <SummaryRow
          icon="document-text-outline"
          label="Visit category"
          value={formatReasonCategory(reasonCategory)}
        />
      )}
      <AppText tone="secondary" variant="caption">
        Timezone: {selection.slot.timezone}
      </AppText>
    </Surface>
  );
}

function SummaryRow({
  icon,
  label,
  value,
}: {
  icon: Parameters<typeof DecorativeIcon>[0]['name'];
  label: string;
  value: string;
}) {
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <View style={styles.row}>
      <DecorativeIcon color={theme.colors.brand} name={icon} size={20} />
      <View style={styles.copy}>
        <AppText tone="secondary" variant="caption">
          {label}
        </AppText>
        <AppText variant="bodyStrong">{value}</AppText>
      </View>
    </View>
  );
}

function createStyles(theme: AppTheme) {
  return StyleSheet.create({
    card: {
      gap: theme.spacing.md,
    },
    row: {
      alignItems: 'flex-start',
      flexDirection: 'row',
      gap: theme.spacing.sm,
    },
    copy: {
      flex: 1,
    },
  });
}
