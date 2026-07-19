import { useMemo, useState } from 'react';
import { StyleSheet, TextInput, View, type TextInputProps, type ViewStyle } from 'react-native';

import { useAppTheme, type AppTheme } from '@/theme';

import { AppText } from './app-text';
import { InlineError } from './inline-error';

type TextFieldProps = Omit<TextInputProps, 'style'> & {
  containerStyle?: ViewStyle;
  error?: string;
  hint?: string;
  label: string;
};

export function TextField({
  containerStyle,
  editable = true,
  error,
  hint,
  label,
  accessibilityHint,
  onBlur,
  onFocus,
  ...props
}: TextFieldProps) {
  const theme = useAppTheme();
  const [isFocused, setIsFocused] = useState(false);
  const styles = useMemo(() => createStyles(theme), [theme]);

  function handleFocus(event: Parameters<NonNullable<TextInputProps['onFocus']>>[0]) {
    setIsFocused(true);
    onFocus?.(event);
  }

  function handleBlur(event: Parameters<NonNullable<TextInputProps['onBlur']>>[0]) {
    setIsFocused(false);
    onBlur?.(event);
  }

  return (
    <View style={[styles.container, containerStyle]}>
      <AppText variant="labelLarge">{label}</AppText>
      <TextInput
        {...props}
        accessibilityHint={error ?? accessibilityHint ?? hint}
        accessibilityLabel={props.accessibilityLabel ?? label}
        accessibilityState={{ disabled: !editable }}
        allowFontScaling
        aria-invalid={Boolean(error)}
        editable={editable}
        onBlur={handleBlur}
        onFocus={handleFocus}
        placeholderTextColor={theme.colors.textSecondary}
        style={[
          styles.input,
          isFocused && styles.focused,
          Boolean(error) && styles.invalid,
          !editable && styles.disabled,
        ]}
      />
      {error ? (
        <InlineError message={error} />
      ) : (
        hint && (
          <AppText tone="secondary" variant="caption">
            {hint}
          </AppText>
        )
      )}
    </View>
  );
}

function createStyles(theme: AppTheme) {
  return StyleSheet.create({
    container: {
      gap: theme.spacing.xs,
    },
    input: {
      ...theme.typeScale.bodyLarge,
      backgroundColor: theme.colors.surfaceRaised,
      borderColor: theme.colors.borderStrong,
      borderRadius: theme.radii.md,
      borderWidth: 1,
      color: theme.colors.textPrimary,
      minHeight: theme.sizes.controlHeight,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
    },
    focused: {
      borderColor: theme.colors.borderFocus,
      borderWidth: 2,
    },
    invalid: {
      borderColor: theme.colors.danger,
    },
    disabled: {
      backgroundColor: theme.colors.surfaceMuted,
      opacity: 0.64,
    },
  });
}
