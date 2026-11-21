import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui';
import { useStrings } from '@/localization/use-strings';
import { useThemedStyles, type AppTheme } from '@/theme';

import { onboardingStrings } from '../localization/onboarding-strings';
import { FeatureRow } from './feature-row';

export function PermissionsStep() {
  const styles = useThemedStyles(createStyles);
  const strings = useStrings(onboardingStrings);

  return (
    <>
      <View style={styles.copy}>
        <AppText accessibilityRole="header" variant="titleLarge">
          {strings.permissionsTitle}
        </AppText>
        <AppText tone="secondary" variant="bodyLarge">
          {strings.permissionsBody}
        </AppText>
      </View>
      <View style={styles.rows}>
        <FeatureRow icon="calendar-outline" text={strings.permissionsCalendar} />
        <FeatureRow icon="notifications-outline" text={strings.permissionsNotifications} />
        <FeatureRow icon="options-outline" text={strings.permissionsChange} />
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
    rows: {
      gap: theme.spacing.sm,
    },
  });
}
