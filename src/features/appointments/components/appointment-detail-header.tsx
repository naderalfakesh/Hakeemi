import { StyleSheet, View } from 'react-native';

import { AppText, DecorativeIcon, IconButton, Skeleton } from '@/components/ui';
import { useStrings } from '@/localization/use-strings';
import { useAppTheme, useThemedStyles, type AppTheme } from '@/theme';

import type { Appointment } from '../domain/types';
import { appointmentDetailStrings } from '../localization/appointment-detail-strings';
import { AppointmentStatusPill } from './appointment-status-pill';

type AppointmentDetailHeaderProps = {
  appointment: Appointment;
  isProviderLoading: boolean;
  onBack: () => void;
  providerName: string;
};

export function AppointmentDetailHeader({
  appointment,
  isProviderLoading,
  onBack,
  providerName,
}: AppointmentDetailHeaderProps) {
  const theme = useAppTheme();
  const strings = useStrings(appointmentDetailStrings);
  const styles = useThemedStyles(createStyles);

  return (
    <>
      <View style={styles.topBar}>
        <IconButton accessibilityLabel={strings.backToAppointments} onPress={onBack} variant="soft">
          <DecorativeIcon color={theme.colors.brand} name="arrow-back" size={22} />
        </IconButton>
        <AppText tone="secondary" variant="labelLarge">
          {strings.appointmentDetails}
        </AppText>
      </View>

      <View style={styles.heading}>
        {isProviderLoading ? (
          <Skeleton height={32} width={180} />
        ) : (
          <AppText accessibilityRole="header" variant="titleLarge">
            {providerName}
          </AppText>
        )}
        <AppointmentStatusPill appointment={appointment} />
      </View>
    </>
  );
}

function createStyles(theme: AppTheme) {
  return StyleSheet.create({
    topBar: { alignItems: 'center', flexDirection: 'row', gap: theme.spacing.sm },
    heading: { gap: theme.spacing.sm },
  });
}
