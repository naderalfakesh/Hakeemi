import { StyleSheet, View } from 'react-native';

import { AppText, Button, InlineError, Surface } from '@/components/ui';
import type {
  PreferencesError,
  PreferencesStatus,
} from '@/features/preferences/context/app-preferences-provider';
import { PreferenceChoices } from '@/features/preferences/components/preference-choices';
import type { AppPreferences } from '@/features/preferences/domain/preferences';
import { isLayoutDirectionPendingRestart } from '@/localization/layout-direction';
import { useStrings } from '@/localization/use-strings';
import { useThemedStyles, type AppTheme } from '@/theme';

import { profileStrings } from '../localization/profile-strings';

type PreferencesCardProps = {
  onRetryPreferences: () => void;
  onUpdatePreferences: (preferences: AppPreferences) => void;
  preferences: AppPreferences;
  preferencesError: PreferencesError | null;
  preferencesStatus: PreferencesStatus;
  subtitle: string;
};

export function PreferencesCard({
  onRetryPreferences,
  onUpdatePreferences,
  preferences,
  preferencesError,
  preferencesStatus,
  subtitle,
}: PreferencesCardProps) {
  const styles = useThemedStyles(createStyles);
  const strings = useStrings(profileStrings);

  return (
    <Surface padding="spacious" style={styles.preferenceCard} variant="plain">
      <View style={styles.preferenceHeading}>
        <AppText variant="titleSmall">{strings.syncedPreferences}</AppText>
        <AppText tone="secondary" variant="bodyMedium">
          {subtitle}
        </AppText>
      </View>

      <PreferenceChoices
        disabled={preferencesStatus !== 'ready'}
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

      <PreferenceChoices
        disabled={preferencesStatus !== 'ready'}
        label={strings.preferredLanguage}
        onChange={(preferredLocale) =>
          onUpdatePreferences({ ...preferences, locale: preferredLocale })
        }
        options={[
          { label: strings.languageEnglish, value: 'en' },
          { label: strings.languageArabic, value: 'ar' },
        ]}
        value={preferences.locale}
      />

      {isLayoutDirectionPendingRestart(preferences.locale) && (
        <AppText accessibilityLiveRegion="polite" tone="secondary" variant="caption">
          {strings.languageRestartHint}
        </AppText>
      )}

      {preferencesStatus === 'loading' && (
        <AppText tone="secondary" variant="caption">
          {strings.loadingPreferences}
        </AppText>
      )}
      {preferencesStatus === 'saving' && (
        <AppText accessibilityLiveRegion="polite" tone="secondary" variant="caption">
          {strings.savingPreferences}
        </AppText>
      )}
      {preferencesStatus === 'error' && (
        <>
          <InlineError
            message={
              preferencesError === 'save-failed'
                ? strings.preferencesSaveFailed
                : preferencesError === 'load-failed'
                  ? strings.preferencesLoadFailed
                  : strings.preferencesErrorFallback
            }
          />
          <Button onPress={onRetryPreferences} variant="secondary">
            {strings.retryPreferences}
          </Button>
        </>
      )}
    </Surface>
  );
}

function createStyles(theme: AppTheme) {
  return StyleSheet.create({
    preferenceCard: {
      gap: theme.spacing.lg,
    },
    preferenceHeading: {
      gap: theme.spacing.xxs,
    },
  });
}
