import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui';
import { useStrings } from '@/localization/use-strings';
import { useThemedStyles, type AppTheme } from '@/theme';

import { onboardingStrings } from '../localization/onboarding-strings';
import { FeatureRow } from './feature-row';

export function JourneyStep() {
  const styles = useThemedStyles(createStyles);
  const strings = useStrings(onboardingStrings);

  return (
    <>
      <View style={styles.copy}>
        <AppText accessibilityRole="header" variant="titleLarge">
          {strings.journeyTitle}
        </AppText>
        <AppText tone="secondary" variant="bodyLarge">
          {strings.journeyBody}
        </AppText>
      </View>
      <View style={styles.rows}>
        <FeatureRow icon="search-outline" text={strings.journeyFind} />
        <FeatureRow icon="time-outline" text={strings.journeyCompare} />
        <FeatureRow icon="checkmark-circle-outline" text={strings.journeyBook} />
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
