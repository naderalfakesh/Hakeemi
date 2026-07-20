import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText, Button, DecorativeIcon, Surface } from '@/components/ui';
import { useAppTheme, type AppTheme } from '@/theme';

type ErrorBoundaryScreenProps = {
  error: Error;
  onRetry: () => void;
};

export function ErrorBoundaryScreen({ error, onRetry }: ErrorBoundaryScreenProps) {
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
      <View style={styles.content}>
        <Surface padding="spacious" style={styles.card} variant="raised">
          <View style={styles.icon}>
            <DecorativeIcon color={theme.colors.danger} name="alert-circle-outline" size={32} />
          </View>
          <AppText accessibilityRole="header" variant="titleMedium">
            Hakeemi needs a fresh start
          </AppText>
          <AppText tone="secondary" variant="bodyLarge">
            This screen could not finish loading. Your account and appointments are safe; try again
            or return to the home screen.
          </AppText>
          <Button onPress={onRetry}>Try again</Button>
          {__DEV__ && (
            <AppText selectable tone="secondary" variant="caption">
              {error.name}
            </AppText>
          )}
        </Surface>
      </View>
    </SafeAreaView>
  );
}

function createStyles(theme: AppTheme) {
  return StyleSheet.create({
    safeArea: {
      backgroundColor: theme.colors.canvas,
      flex: 1,
    },
    content: {
      alignItems: 'center',
      flex: 1,
      justifyContent: 'center',
      padding: theme.spacing.lg,
    },
    card: {
      gap: theme.spacing.md,
      maxWidth: theme.sizes.contentMaxWidth,
      width: '100%',
    },
    icon: {
      alignItems: 'center',
      backgroundColor: theme.colors.dangerSoft,
      borderRadius: theme.radii.md,
      height: 56,
      justifyContent: 'center',
      width: 56,
    },
  });
}
