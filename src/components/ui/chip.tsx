import { Pressable, StyleSheet, type PressableProps } from 'react-native';

import { useAppTheme, useThemedStyles, type AppTheme } from '@/theme';

import { AppText } from './app-text';

type ChipProps = Omit<PressableProps, 'children' | 'style'> & {
  label: string;
  selected?: boolean;
};

export function Chip({ disabled = false, label, selected = false, ...props }: ChipProps) {
  const theme = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const isDisabled = disabled === true;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, selected }}
      android_ripple={{ color: theme.colors.brandSoft }}
      disabled={isDisabled}
      {...props}
      style={({ pressed }) => [
        styles.base,
        selected && styles.selected,
        pressed && styles.pressed,
        isDisabled && styles.disabled,
      ]}
    >
      <AppText style={styles.label} tone={selected ? 'inverse' : 'primary'} variant="labelLarge">
        {label}
      </AppText>
    </Pressable>
  );
}

function createStyles(theme: AppTheme) {
  return StyleSheet.create({
    base: {
      alignItems: 'center',
      alignSelf: 'flex-start',
      backgroundColor: theme.colors.surfaceMuted,
      borderColor: theme.colors.borderSubtle,
      borderRadius: theme.radii.sm,
      borderWidth: 1,
      justifyContent: 'center',
      maxWidth: '100%',
      minHeight: theme.sizes.minimumTouchTarget,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.xxs,
    },
    label: {
      flexShrink: 1,
      textAlign: 'center',
    },
    selected: {
      backgroundColor: theme.colors.brand,
      borderColor: theme.colors.brand,
    },
    pressed: {
      opacity: 0.82,
      transform: [{ scale: 0.98 }],
    },
    disabled: {
      opacity: 0.46,
    },
  });
}
