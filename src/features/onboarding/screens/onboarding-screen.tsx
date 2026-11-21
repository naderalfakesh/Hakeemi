import { useMemo, type ReactNode } from 'react';
import { ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText, BrandMark, Button } from '@/components/ui';
import type { AppPreferences } from '@/features/preferences/domain/preferences';
import { useStrings } from '@/localization/use-strings';
import { useAppTheme, type AppTheme } from '@/theme';

import { JourneyStep } from '../components/journey-step';
import { OnboardingArtwork } from '../components/onboarding-artwork';
import { OnboardingFooter } from '../components/onboarding-footer';
import { PermissionsStep } from '../components/permissions-step';
import { PersonalizeStep } from '../components/personalize-step';
import { useOnboardingPager } from '../hooks/use-onboarding-pager';
import { onboardingStrings } from '../localization/onboarding-strings';
import { onboardingSteps, type OnboardingStepKey } from '../onboarding-steps';

type OnboardingScreenProps = {
  onComplete: () => void;
  onSkip: () => void;
  onUpdatePreferences: (preferences: AppPreferences) => void;
  preferences: AppPreferences;
};

export function OnboardingScreen({
  onComplete,
  onSkip,
  onUpdatePreferences,
  preferences,
}: OnboardingScreenProps) {
  const theme = useAppTheme();
  const strings = useStrings(onboardingStrings);
  const { fontScale, height, width } = useWindowDimensions();
  const isCompact = height < 720;
  const isTablet = width >= 768;
  // At accessibility text sizes the Back/Next pair no longer fits side by side.
  const stackActions = fontScale >= 1.5;
  const styles = useMemo(() => createStyles(theme, { isCompact }), [isCompact, theme]);
  const pageWidth = Math.min(width, theme.sizes.contentMaxWidth) - theme.spacing.lg * 2;
  const {
    activeStep,
    isFirstStep,
    isLastStep,
    scrollViewRef,
    initialContentOffset,
    handleMomentumScrollEnd,
    showNextStep,
    showPreviousStep,
  } = useOnboardingPager({ pageWidth, stepCount: onboardingSteps.length });

  const stepContent: Record<OnboardingStepKey, ReactNode> = {
    personalize: (
      <PersonalizeStep onUpdatePreferences={onUpdatePreferences} preferences={preferences} />
    ),
    journey: <JourneyStep />,
    permissions: <PermissionsStep />,
  };

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
      <View style={styles.content}>
        <View style={styles.brandRow}>
          <BrandMark />
          <AppText variant="titleSmall">{strings.brandWordmark}</AppText>
          {!isLastStep && (
            <View style={styles.skipAction}>
              <Button
                accessibilityLabel={strings.skipAccessibilityLabel}
                onPress={onSkip}
                variant="tertiary"
              >
                {strings.skip}
              </Button>
            </View>
          )}
        </View>

        <ScrollView
          bounces={false}
          contentOffset={initialContentOffset}
          decelerationRate="fast"
          horizontal
          onMomentumScrollEnd={handleMomentumScrollEnd}
          pagingEnabled
          ref={scrollViewRef}
          showsHorizontalScrollIndicator={false}
          style={styles.stepViewport}
          testID="onboarding-pages"
        >
          {onboardingSteps.map((step, logicalIndex) => {
            const isActive = logicalIndex === activeStep;

            return (
              <ScrollView
                accessibilityElementsHidden={!isActive}
                accessibilityLiveRegion={isActive ? 'polite' : 'none'}
                contentContainerStyle={styles.stepContent}
                importantForAccessibility={isActive ? 'auto' : 'no-hide-descendants'}
                key={step.key}
                showsVerticalScrollIndicator={false}
                style={{ width: pageWidth }}
              >
                {'illustration' in step && (
                  <OnboardingArtwork
                    illustration={step.illustration}
                    isCompact={isCompact}
                    isTablet={isTablet}
                    surface={step.surface}
                  />
                )}
                {stepContent[step.key]}
              </ScrollView>
            );
          })}
        </ScrollView>

        <OnboardingFooter
          activeStep={activeStep}
          isCompact={isCompact}
          isFirstStep={isFirstStep}
          isLastStep={isLastStep}
          onBack={showPreviousStep}
          onComplete={onComplete}
          onNext={showNextStep}
          stackActions={stackActions}
          stepKeys={onboardingSteps.map((step) => step.key)}
        />
      </View>
    </SafeAreaView>
  );
}

function createStyles(theme: AppTheme, { isCompact }: { isCompact: boolean }) {
  return StyleSheet.create({
    safeArea: {
      backgroundColor: theme.colors.canvas,
      flex: 1,
    },
    content: {
      alignSelf: 'center',
      flex: 1,
      maxWidth: theme.sizes.contentMaxWidth,
      paddingHorizontal: theme.spacing.lg,
      width: '100%',
    },
    brandRow: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: theme.spacing.sm,
      minHeight: theme.sizes.minimumTouchTarget,
      paddingTop: theme.spacing.xs,
    },
    skipAction: {
      marginStart: 'auto',
    },
    stepViewport: {
      flex: 1,
    },
    stepContent: {
      flexGrow: 1,
      gap: isCompact ? theme.spacing.md : theme.spacing.lg,
      justifyContent: 'center',
      paddingBottom: isCompact ? theme.spacing.sm : theme.spacing.lg,
      paddingTop: isCompact ? theme.spacing.sm : theme.spacing.md,
    },
  });
}
