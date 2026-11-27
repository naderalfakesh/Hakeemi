import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText, Button } from '@/components/ui';
import { useStrings } from '@/localization/use-strings';
import { useAppTheme, type AppTheme } from '@/theme';

import { onboardingStrings } from '../localization/onboarding-strings';
import type { OnboardingStepKey } from '../onboarding-steps';

type OnboardingFooterProps = {
  activeStep: number;
  isCompact: boolean;
  isFirstStep: boolean;
  isLastStep: boolean;
  onBack: () => void;
  onComplete: () => void;
  onNext: () => void;
  stackActions: boolean;
  stepKeys: readonly OnboardingStepKey[];
};

export function OnboardingFooter({
  activeStep,
  isCompact,
  isFirstStep,
  isLastStep,
  onBack,
  onComplete,
  onNext,
  stackActions,
  stepKeys,
}: OnboardingFooterProps) {
  const theme = useAppTheme();
  const strings = useStrings(onboardingStrings);
  const styles = useMemo(
    () => createStyles(theme, { isCompact, stackActions }),
    [isCompact, stackActions, theme],
  );

  return (
    <View style={styles.footer}>
      <View
        accessibilityLabel={strings.stepProgress(activeStep + 1, stepKeys.length)}
        accessibilityRole="text"
        accessible
        style={styles.progressRow}
      >
        <AppText tone="secondary" variant="caption">
          {strings.stepProgress(activeStep + 1, stepKeys.length)}
        </AppText>
        <View accessibilityElementsHidden importantForAccessibility="no" style={styles.dots}>
          {stepKeys.map((key, index) => (
            <View key={key} style={[styles.dot, index === activeStep && styles.dotActive]} />
          ))}
        </View>
      </View>

      <View style={styles.navigationRow}>
        {!isFirstStep && (
          <View style={styles.backAction}>
            <Button onPress={onBack} variant="secondary">
              {strings.back}
            </Button>
          </View>
        )}
        <View style={styles.primaryAction}>
          {isLastStep ? (
            <Button accessibilityLabel={strings.finishAccessibilityLabel} onPress={onComplete}>
              {strings.finish}
            </Button>
          ) : (
            <Button accessibilityLabel={strings.nextAccessibilityLabel} onPress={onNext}>
              {strings.next}
            </Button>
          )}
        </View>
      </View>
    </View>
  );
}

function createStyles(
  theme: AppTheme,
  { isCompact, stackActions }: { isCompact: boolean; stackActions: boolean },
) {
  return StyleSheet.create({
    footer: {
      gap: isCompact ? theme.spacing.xxs : theme.spacing.xs,
      paddingBottom: theme.spacing.xs,
      paddingHorizontal: theme.spacing.lg,
    },
    progressRow: {
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'space-between',
      minHeight: theme.sizes.minimumTouchTarget,
    },
    dots: {
      flexDirection: 'row',
      gap: theme.spacing.xs,
    },
    dot: {
      backgroundColor: theme.colors.borderStrong,
      borderRadius: theme.radii.full,
      height: 7,
      width: 7,
    },
    dotActive: {
      backgroundColor: theme.colors.brand,
      width: 24,
    },
    navigationRow: {
      flexDirection: stackActions ? 'column-reverse' : 'row',
      gap: stackActions ? theme.spacing.xs : theme.spacing.sm,
    },
    backAction: {
      flex: stackActions ? 0 : 1,
    },
    primaryAction: {
      flex: stackActions ? 0 : 2,
    },
  });
}
