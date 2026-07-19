import { useMemo, type ReactNode } from 'react';
import { StyleSheet, View, type ViewProps } from 'react-native';

import { useAppTheme, type AppTheme } from '@/theme';

import { AppText } from './app-text';

type EmptyStateProps = Omit<ViewProps, 'children'> & {
  action?: ReactNode;
  description: string;
  icon?: ReactNode;
  title: string;
};

export function EmptyState({ action, description, icon, style, title, ...props }: EmptyStateProps) {
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <View {...props} style={[styles.container, style]}>
      {icon && <View style={styles.icon}>{icon}</View>}
      <AppText accessibilityRole="header" style={styles.centered} variant="titleSmall">
        {title}
      </AppText>
      <AppText style={styles.centered} tone="secondary" variant="bodyMedium">
        {description}
      </AppText>
      {action && <View style={styles.action}>{action}</View>}
    </View>
  );
}

function createStyles(theme: AppTheme) {
  return StyleSheet.create({
    container: {
      alignItems: 'center',
      paddingHorizontal: theme.spacing.lg,
      paddingVertical: theme.spacing.xl,
    },
    icon: {
      marginBottom: theme.spacing.md,
    },
    centered: {
      maxWidth: 420,
      textAlign: 'center',
    },
    action: {
      marginTop: theme.spacing.lg,
      minWidth: 180,
    },
  });
}
