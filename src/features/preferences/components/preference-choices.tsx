import { StyleSheet, View } from 'react-native';

import { AppText, Chip } from '@/components/ui';
import { useThemedStyles, type AppTheme } from '@/theme';

export type PreferenceOption<Value extends string> = {
  label: string;
  value: Value;
};

type PreferenceChoicesProps<Value extends string> = {
  disabled: boolean;
  label: string;
  onChange: (value: Value) => void;
  options: readonly PreferenceOption<Value>[];
  value: Value;
};

export function PreferenceChoices<Value extends string>({
  disabled,
  label,
  onChange,
  options,
  value,
}: PreferenceChoicesProps<Value>) {
  const styles = useThemedStyles(createStyles);

  return (
    <View style={styles.preferenceGroup}>
      <AppText variant="bodyStrong">{label}</AppText>
      <View accessibilityRole="radiogroup" style={styles.preferenceOptions}>
        {options.map((option) => (
          <Chip
            disabled={disabled}
            key={option.value}
            label={option.label}
            onPress={() => onChange(option.value)}
            selected={option.value === value}
          />
        ))}
      </View>
    </View>
  );
}

function createStyles(theme: AppTheme) {
  return StyleSheet.create({
    preferenceGroup: {
      gap: theme.spacing.sm,
    },
    preferenceOptions: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: theme.spacing.xs,
    },
  });
}
