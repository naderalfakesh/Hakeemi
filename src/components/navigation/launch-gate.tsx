import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { AppText, BrandMark } from '@/components/ui';
import { useAppTheme, useThemedStyles, type AppTheme } from '@/theme';

// Matches the native splash tile (96dp × 5/6) to prevent a hand-off jump.
export const LAUNCH_MARK_SIZE = 80;

type LaunchGateProps = {
  accessibilityLabel?: string;
  message?: string;
};

export function LaunchGate({ accessibilityLabel, message }: LaunchGateProps) {
  const theme = useAppTheme();
  const styles = useThemedStyles(createStyles);

  return (
    <View
      accessibilityLabel={accessibilityLabel}
      accessible={accessibilityLabel !== undefined}
      style={styles.canvas}
      testID="launch-gate"
    >
      <BrandMark size={LAUNCH_MARK_SIZE} />
      {message !== undefined && (
        <View style={styles.status}>
          <ActivityIndicator color={theme.colors.brand} size="small" />
          <AppText tone="secondary" variant="bodyMedium">
            {message}
          </AppText>
        </View>
      )}
    </View>
  );
}

function createStyles(theme: AppTheme) {
  return StyleSheet.create({
    canvas: {
      alignItems: 'center',
      backgroundColor: theme.colors.canvas,
      flex: 1,
      justifyContent: 'center',
    },
    status: {
      alignItems: 'center',
      bottom: '16%',
      gap: theme.spacing.sm,
      paddingHorizontal: theme.spacing.lg,
      position: 'absolute',
    },
  });
}
