import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText, Button, DecorativeIcon, Surface } from '@/components/ui';
import { useStrings } from '@/localization/use-strings';
import { useAppTheme, type AppTheme } from '@/theme';

import { navigationStrings } from './navigation-strings';

type ErrorBoundaryScreenProps = {
  error: Error;
  onRetry: () => void;
};

export function ErrorBoundaryScreen({ error, onRetry }: ErrorBoundaryScreenProps) {
  const theme = useAppTheme();
  const strings = useStrings(navigationStrings);
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
      <View style={styles.content}>
        <Surface padding="spacious" style={styles.card} variant="raised">
          <View style={styles.icon}>
            <DecorativeIcon color={theme.colors.danger} name="alert-circle-outline" size={32} />
          </View>
          <AppText accessibilityRole="header" variant="titleMedium">
            {strings.errorBoundary.title}
          </AppText>
          <AppText tone="secondary" variant="bodyLarge">
            {strings.errorBoundary.body}
          </AppText>
          <Button onPress={onRetry}>{strings.errorBoundary.tryAgain}</Button>
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
