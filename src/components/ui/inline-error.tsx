import { useMemo } from 'react';
import { StyleSheet, View, type ViewProps } from 'react-native';

import { useAppTheme, type AppTheme } from '@/theme';

import { AppText } from './app-text';
import { DecorativeIcon } from './decorative-icon';

type InlineErrorProps = Omit<ViewProps, 'children'> & {
  message: string;
};

export function InlineError({ message, style, ...props }: InlineErrorProps) {
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <View
      accessibilityLiveRegion="polite"
      accessibilityRole="alert"
      {...props}
      style={[styles.container, style]}
    >
      <DecorativeIcon color={theme.colors.danger} name="alert-circle" size={18} />
      <AppText tone="danger" variant="caption">
        {message}
      </AppText>
    </View>
  );
}

function createStyles(theme: AppTheme) {
  return StyleSheet.create({
    container: {
      alignItems: 'flex-start',
      flexDirection: 'row',
      gap: theme.spacing.xs,
    },
  });
}
