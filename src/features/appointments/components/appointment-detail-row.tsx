import { StyleSheet, View } from 'react-native';

import { AppText, DecorativeIcon } from '@/components/ui';
import { useAppTheme, useThemedStyles, type AppTheme } from '@/theme';

export function AppointmentDetailRow({
  icon,
  label,
  tone = 'secondary',
}: {
  icon: 'calendar-outline' | 'location-outline' | 'videocam-outline';
  label: string;
  tone?: 'primary' | 'secondary';
}) {
  const theme = useAppTheme();
  const styles = useThemedStyles(createStyles);
  return (
    <View style={styles.detailRow}>
      <DecorativeIcon color={theme.colors.brand} name={icon} size={20} />
      <AppText style={styles.flexText} tone={tone} variant="bodyMedium">
        {label}
      </AppText>
    </View>
  );
}

function createStyles(theme: AppTheme) {
  return StyleSheet.create({
    detailRow: { alignItems: 'center', flexDirection: 'row', gap: theme.spacing.sm },
    flexText: { flex: 1 },
  });
}
