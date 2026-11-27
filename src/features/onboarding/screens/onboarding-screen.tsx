import { useMemo, type ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText, BrandMark, Button } from '@/components/ui';
import { useStrings } from '@/localization/use-strings';
import { useAppTheme, useResponsiveLayout, type AppTheme } from '@/theme';

import { IntroStep } from '../components/intro-step';
import { JourneyStep } from '../components/journey-step';
import { OnboardingArtwork } from '../components/onboarding-artwork';
import { OnboardingFooter } from '../components/onboarding-footer';
import { PermissionsStep } from '../components/permissions-step';
import { useOnboardingPager } from '../hooks/use-onboarding-pager';
import { onboardingStrings } from '../localization/onboarding-strings';
import { onboardingSteps, type OnboardingStepKey } from '../onboarding-steps';

type OnboardingScreenProps = {
  onComplete: () => void;
  onSkip: () => void;
};

export function OnboardingScreen({ onComplete, onSkip }: OnboardingScreenProps) {
  const theme = useAppTheme();
  const strings = useStrings(onboardingStrings);
  const { isCompact, isTablet, stackActions, width } = useResponsiveLayout();
  const styles = useMemo(() => createStyles(theme, { isCompact }), [isCompact, theme]);
  const pageWidth = Math.min(width, theme.sizes.contentMaxWidth);
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
    intro: <IntroStep />,
    journey: <JourneyStep />,
    permissions: <PermissionsStep />,
  };

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
      <View style={styles.content}>
        <View style={styles.brandRow}>
          <BrandMark />
          <AppText variant="titleSmall">{strings.brandWordmark}</AppText>
          {/* Keep mounted on the last step so header height does not jump. */}
          <View
            accessibilityElementsHidden={isLastStep}
            importantForAccessibility={isLastStep ? 'no-hide-descendants' : 'auto'}
            pointerEvents={isLastStep ? 'none' : 'auto'}
            style={[styles.skipAction, isLastStep && styles.skipActionHidden]}
          >
            <Button
              accessibilityLabel={strings.skipAccessibilityLabel}
              onPress={onSkip}
              variant="tertiary"
            >
              {strings.skip}
            </Button>
          </View>
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
                <OnboardingArtwork
                  illustration={step.illustration}
                  isCompact={isCompact}
                  isTablet={isTablet}
                  surface={step.surface}
                />
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
      width: '100%',
    },
    brandRow: {
      marginHorizontal: theme.spacing.lg,
      alignItems: 'center',
      flexDirection: 'row',
      gap: theme.spacing.sm,
      minHeight: theme.sizes.minimumTouchTarget,
      paddingTop: theme.spacing.xs,
    },
    skipAction: {
      marginStart: 'auto',
    },
    skipActionHidden: {
      opacity: 0,
    },
    stepViewport: {
      flex: 1,
    },
    stepContent: {
      flexGrow: 1,
      gap: isCompact ? theme.spacing.md : theme.spacing.lg,
      paddingHorizontal: theme.spacing.lg,
      paddingBottom: isCompact ? theme.spacing.sm : theme.spacing.lg,
      paddingTop: isCompact ? theme.spacing.sm : theme.spacing.md,
    },
  });
}
