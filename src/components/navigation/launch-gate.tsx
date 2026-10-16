import { useMemo } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { AppText, BrandMark } from '@/components/ui';
import { useAppTheme, type AppTheme } from '@/theme';

// Same size the native splash renders the tile at (imageWidth 96 dp on a
// 512 px canvas holding a 5/6 tile), so the mark does not jump on hand-off.
export const LAUNCH_MARK_SIZE = 80;

type LaunchGateProps = {
  accessibilityLabel?: string;
  message?: string;
};

/**
 * Full-screen canvas with the brand tile centred exactly where the native
 * splash leaves it. With a message it also shows progress below the mark.
 */
export function LaunchGate({ accessibilityLabel, message }: LaunchGateProps) {
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

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
