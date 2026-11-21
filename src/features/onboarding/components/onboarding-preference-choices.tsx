import { StyleSheet, View } from 'react-native';

import { AppText, Chip } from '@/components/ui';
import { useThemedStyles, type AppTheme } from '@/theme';

type OnboardingPreferenceChoicesProps<Value extends string> = {
  label: string;
  onChange: (value: Value) => void;
  options: readonly { label: string; language?: string; value: Value }[];
  value: Value;
};

export function OnboardingPreferenceChoices<Value extends string>({
  label,
  onChange,
  options,
  value,
}: OnboardingPreferenceChoicesProps<Value>) {
  const styles = useThemedStyles(createStyles);

  return (
    <View style={styles.preferenceGroup}>
      <AppText variant="bodyStrong">{label}</AppText>
      <View
        accessibilityLabel={label}
        accessibilityRole="radiogroup"
        style={styles.preferenceOptions}
      >
        {options.map((option) => (
          <Chip
            accessibilityLanguage={option.language}
            accessibilityRole="radio"
            accessibilityState={{ checked: option.value === value }}
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
      gap: theme.spacing.xs,
    },
    preferenceOptions: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: theme.spacing.xs,
    },
  });
}
