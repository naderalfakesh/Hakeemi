import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui';
import { useStrings } from '@/localization/use-strings';
import { useThemedStyles, type AppTheme } from '@/theme';

import { onboardingStrings } from '../localization/onboarding-strings';

export function IntroStep() {
  const styles = useThemedStyles(createStyles);
  const strings = useStrings(onboardingStrings);

  return (
    <View style={styles.copy}>
      <AppText accessibilityRole="header" maxFontSizeMultiplier={1.5} variant="display">
        {strings.headline}
      </AppText>
      <AppText tone="secondary" variant="bodyLarge">
        {strings.subheadline}
      </AppText>
    </View>
  );
}

function createStyles(theme: AppTheme) {
  return StyleSheet.create({
    copy: {
      gap: theme.spacing.sm,
      maxWidth: 580,
    },
  });
}
