import { StyleSheet, View } from 'react-native';

import { AppText, Button, DecorativeIcon } from '@/components/ui';
import { useStrings } from '@/localization/use-strings';
import { useAppTheme, useThemedStyles, type AppTheme } from '@/theme';

import { appointmentsStrings } from '../localization/appointments-strings';

type AppointmentsHeaderProps = {
  hasAppointments: boolean;
  onFindCare: () => void;
};

export function AppointmentsHeader({ hasAppointments, onFindCare }: AppointmentsHeaderProps) {
  const theme = useAppTheme();
  const strings = useStrings(appointmentsStrings);
  const styles = useThemedStyles(createStyles);
  const actionLabel = hasAppointments ? strings.bookAnotherAppointment : strings.bookAppointment;

  return (
    <View style={styles.heading}>
      <View style={styles.headingCopy}>
        <AppText accessibilityRole="header" variant="titleLarge">
          {strings.title}
        </AppText>
        <AppText tone="secondary" variant="bodyMedium">
          {strings.subtitle}
        </AppText>
      </View>
      <Button
        accessibilityLabel={actionLabel}
        leading={<DecorativeIcon color={theme.colors.brand} name="add-circle-outline" size={20} />}
        onPress={onFindCare}
        variant="secondary"
      >
        {actionLabel}
      </Button>
    </View>
  );
}

function createStyles(theme: AppTheme) {
  return StyleSheet.create({
    heading: {
      gap: theme.spacing.md,
      marginBottom: theme.spacing.sm,
    },
    headingCopy: {
      gap: theme.spacing.xs,
    },
  });
}
