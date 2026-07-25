import { useMemo, type ReactNode } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View, type PressableProps } from 'react-native';

import { useAppTheme, type AppTheme } from '@/theme';

import { AppText, type TextTone } from './app-text';

export type ButtonVariant = 'danger' | 'dangerSoft' | 'primary' | 'secondary' | 'tertiary';

type ButtonProps = Omit<PressableProps, 'children' | 'disabled' | 'style'> & {
  busy?: boolean;
  children: ReactNode;
  disabled?: boolean;
  leading?: ReactNode;
  variant?: ButtonVariant;
};

export function Button({
  busy = false,
  children,
  disabled = false,
  leading,
  variant = 'primary',
  ...props
}: ButtonProps) {
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const isDisabled = disabled || busy;
  const foregroundColor = getForegroundColor(theme, variant);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ busy, disabled: isDisabled }}
      android_ripple={{ color: theme.colors.brandSoft }}
      disabled={isDisabled}
      {...props}
      style={({ pressed }) => [
        styles.base,
        styles[variant],
        pressed && styles.pressed,
        isDisabled && styles.disabled,
      ]}
    >
      <View style={styles.content}>
        {busy ? (
          <ActivityIndicator color={foregroundColor} size="small" />
        ) : (
          leading && <View style={styles.leading}>{leading}</View>
        )}
        <AppText tone={getTextTone(variant)} variant="labelLarge">
          {children}
        </AppText>
      </View>
    </Pressable>
  );
}

function getTextTone(variant: ButtonVariant): TextTone {
  if (variant === 'primary' || variant === 'danger') {
    return 'inverse';
  }

  if (variant === 'dangerSoft') {
    return 'danger';
  }

  return variant === 'secondary' ? 'brand' : 'primary';
}

function getForegroundColor(theme: AppTheme, variant: ButtonVariant) {
  if (variant === 'primary' || variant === 'danger') {
    return theme.colors.textInverse;
  }

  if (variant === 'dangerSoft') {
    return theme.colors.danger;
  }

  return variant === 'secondary' ? theme.colors.brand : theme.colors.textPrimary;
}

function createStyles(theme: AppTheme) {
  return StyleSheet.create({
    base: {
      alignItems: 'center',
      borderRadius: theme.radii.md,
      justifyContent: 'center',
      minHeight: theme.sizes.controlHeight,
      minWidth: theme.sizes.minimumTouchTarget,
      overflow: 'hidden',
      paddingHorizontal: theme.spacing.lg,
    },
    primary: {
      backgroundColor: theme.colors.brand,
    },
    secondary: {
      backgroundColor: theme.colors.brandSoft,
      borderColor: theme.colors.borderFocus,
      borderWidth: 1,
    },
    tertiary: {
      backgroundColor: 'transparent',
    },
    danger: {
      backgroundColor: theme.colors.danger,
    },
    dangerSoft: {
      backgroundColor: theme.colors.dangerSoft,
    },
    content: {
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'center',
    },
    leading: {
      marginEnd: theme.spacing.xs,
    },
    pressed: {
      opacity: 0.86,
      transform: [{ translateY: 1 }, { scale: 0.99 }],
    },
    disabled: {
      opacity: 0.46,
    },
  });
}
