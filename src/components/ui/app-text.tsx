import { useMemo } from 'react';
import { StyleSheet, Text, type TextProps, type TextStyle } from 'react-native';

import { useAppTheme, type AppTheme } from '@/theme';

export type TextTone = 'brand' | 'danger' | 'inverse' | 'primary' | 'secondary' | 'success';
export type TextVariant = keyof AppTheme['typeScale'];

type AppTextProps = TextProps & {
  tone?: TextTone;
  variant?: TextVariant;
};

function getToneColor(theme: AppTheme, tone: TextTone) {
  const colors: Record<TextTone, string> = {
    brand: theme.colors.brand,
    danger: theme.colors.danger,
    inverse: theme.colors.textInverse,
    primary: theme.colors.textPrimary,
    secondary: theme.colors.textSecondary,
    success: theme.colors.success,
  };

  return colors[tone];
}

export function AppText({
  style,
  tone = 'primary',
  variant = 'bodyMedium',
  ...props
}: AppTextProps) {
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme, tone, variant), [theme, tone, variant]);

  return <Text allowFontScaling {...props} style={[styles.text, style]} />;
}

function createStyles(theme: AppTheme, tone: TextTone, variant: TextVariant) {
  return StyleSheet.create({
    text: {
      ...theme.typeScale[variant],
      color: getToneColor(theme, tone),
    } as TextStyle,
  });
}
