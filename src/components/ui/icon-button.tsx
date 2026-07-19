import { useMemo, type ReactNode } from 'react';
import { Pressable, StyleSheet, type PressableProps } from 'react-native';

import { useAppTheme, type AppTheme } from '@/theme';

type IconButtonVariant = 'filled' | 'ghost' | 'soft';

type IconButtonProps = Omit<PressableProps, 'accessibilityLabel' | 'children' | 'style'> & {
  accessibilityLabel: string;
  children: ReactNode;
  variant?: IconButtonVariant;
};

export function IconButton({
  accessibilityLabel,
  children,
  disabled = false,
  variant = 'ghost',
  ...props
}: IconButtonProps) {
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const isDisabled = disabled === true;

  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled }}
      android_ripple={{ color: theme.colors.brandSoft, borderless: true }}
      disabled={isDisabled}
      hitSlop={theme.spacing.xxs}
      {...props}
      style={({ pressed }) => [
        styles.base,
        styles[variant],
        pressed && styles.pressed,
        isDisabled && styles.disabled,
      ]}
    >
      {children}
    </Pressable>
  );
}

function createStyles(theme: AppTheme) {
  return StyleSheet.create({
    base: {
      alignItems: 'center',
      borderRadius: theme.radii.md,
      height: theme.sizes.iconButton,
      justifyContent: 'center',
      overflow: 'hidden',
      width: theme.sizes.iconButton,
    },
    filled: {
      backgroundColor: theme.colors.brand,
    },
    ghost: {
      backgroundColor: 'transparent',
    },
    soft: {
      backgroundColor: theme.colors.brandSoft,
    },
    pressed: {
      opacity: 0.78,
      transform: [{ scale: 0.96 }],
    },
    disabled: {
      opacity: 0.42,
    },
  });
}
