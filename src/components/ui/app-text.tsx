import { useMemo } from 'react';
import { StyleSheet, Text, type TextProps, type TextStyle } from 'react-native';

import { useAppTheme, type AppTheme } from '@/theme';
import { useAppLocale } from '@/localization/locale-provider';

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
  const { isRTL } = useAppLocale();
  const styles = useMemo(
    () => createStyles(theme, tone, variant, isRTL),
    [isRTL, theme, tone, variant],
  );

  return (
    <Text allowFontScaling maxFontSizeMultiplier={2} {...props} style={[styles.text, style]} />
  );
}

function createStyles(theme: AppTheme, tone: TextTone, variant: TextVariant, isRTL: boolean) {
  return StyleSheet.create({
    text: {
      ...theme.typeScale[variant],
      color: getToneColor(theme, tone),
      // When the native layout is RTL, React Native swaps left/right styles,
      // so 'left' is the logical start edge in both directions. Passing
      // 'right' here would be swapped back to the physical left in RTL.
      textAlign: 'left',
      writingDirection: isRTL ? 'rtl' : 'ltr',
    } as TextStyle,
  });
}
