import { useMemo, type ReactNode } from 'react';
import { StyleSheet, View, type ViewProps } from 'react-native';

import { useAppTheme, type AppTheme } from '@/theme';

type SurfaceVariant = 'brand' | 'muted' | 'plain' | 'raised';

type SurfaceProps = ViewProps & {
  children: ReactNode;
  padding?: 'compact' | 'default' | 'none' | 'spacious';
  variant?: SurfaceVariant;
};

export function Surface({
  children,
  padding = 'default',
  style,
  variant = 'plain',
  ...props
}: SurfaceProps) {
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <View {...props} style={[styles.base, styles[variant], styles[padding], style]}>
      {children}
    </View>
  );
}

function createStyles(theme: AppTheme) {
  return StyleSheet.create({
    base: {
      borderRadius: theme.radii.lg,
    },
    brand: {
      backgroundColor: theme.colors.surfaceBrand,
    },
    muted: {
      backgroundColor: theme.colors.surfaceMuted,
    },
    plain: {
      backgroundColor: theme.colors.surface,
    },
    raised: {
      ...theme.shadows.raised,
      backgroundColor: theme.colors.surfaceRaised,
    },
    compact: {
      padding: theme.spacing.sm,
    },
    default: {
      padding: theme.spacing.md,
    },
    none: {
      padding: theme.spacing.none,
    },
    spacious: {
      padding: theme.spacing.lg,
    },
  });
}
