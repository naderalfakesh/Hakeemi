import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui';
import type { AppPreferences } from '@/features/preferences/domain/preferences';
import { useStrings } from '@/localization/use-strings';
import { useThemedStyles, type AppTheme } from '@/theme';

import { onboardingStrings } from '../localization/onboarding-strings';
import { OnboardingPreferenceChoices } from './onboarding-preference-choices';

type PersonalizeStepProps = {
  onUpdatePreferences: (preferences: AppPreferences) => void;
  preferences: AppPreferences;
};

export function PersonalizeStep({ onUpdatePreferences, preferences }: PersonalizeStepProps) {
  const styles = useThemedStyles(createStyles);
  const strings = useStrings(onboardingStrings);

  return (
    <>
      <View style={styles.copy}>
        <AppText accessibilityRole="header" maxFontSizeMultiplier={1.5} variant="display">
          {strings.headline}
        </AppText>
        <AppText tone="secondary" variant="bodyLarge">
          {strings.subheadline}
        </AppText>
      </View>
      <View style={styles.preferenceCard}>
        <OnboardingPreferenceChoices
          label={strings.language}
          onChange={(locale) => onUpdatePreferences({ ...preferences, locale })}
          options={[
            { label: strings.languageEnglish, language: 'en', value: 'en' },
            { label: strings.languageArabic, language: 'ar', value: 'ar' },
          ]}
          value={preferences.locale}
        />
        <OnboardingPreferenceChoices
          label={strings.appearance}
          onChange={(themePreference) =>
            onUpdatePreferences({ ...preferences, theme: themePreference })
          }
          options={[
            { label: strings.appearanceSystem, value: 'system' },
            { label: strings.appearanceLight, value: 'light' },
            { label: strings.appearanceDark, value: 'dark' },
          ]}
          value={preferences.theme}
        />
        <AppText tone="secondary" variant="caption">
          {strings.languageReloadNote}
        </AppText>
      </View>
    </>
  );
}

function createStyles(theme: AppTheme) {
  return StyleSheet.create({
    copy: {
      gap: theme.spacing.sm,
      maxWidth: 580,
    },
    preferenceCard: {
      backgroundColor: theme.colors.surfaceBrand,
      borderRadius: theme.radii.xl,
      gap: theme.spacing.md,
      padding: theme.spacing.lg,
    },
  });
}
