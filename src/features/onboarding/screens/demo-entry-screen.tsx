import { useMemo, useState } from 'react';
import {
  Image,
  StyleSheet,
  View,
  useWindowDimensions,
  type ImageSourcePropType,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText, Button, DecorativeIcon } from '@/components/ui';
import { useStrings } from '@/localization/use-strings';
import { useAppTheme, type AppTheme, type SemanticColors } from '@/theme';

import { onboardingStrings } from '../localization/onboarding-strings';

const onboardingSlides = [
  {
    illustration: require('../../../../assets/illustrations/welcome-hero.webp'),
    key: 'welcome',
    surface: 'surfaceBrand',
  },
  {
    illustration: require('../../../../assets/illustrations/onboarding-discover.webp'),
    key: 'discover',
    surface: 'infoSoft',
  },
  {
    illustration: require('../../../../assets/illustrations/onboarding-book.webp'),
    key: 'book',
    surface: 'accentSoft',
  },
  {
    illustration: require('../../../../assets/illustrations/onboarding-care.webp'),
    key: 'care',
    surface: 'successSoft',
  },
] as const satisfies readonly {
  illustration: ImageSourcePropType;
  key: 'book' | 'care' | 'discover' | 'welcome';
  surface: keyof SemanticColors;
}[];

type OnboardingSlideKey = (typeof onboardingSlides)[number]['key'];

type DemoEntryScreenProps = {
  onComplete: () => void;
  onSkip: () => void;
};

export function OnboardingScreen({ onComplete, onSkip }: DemoEntryScreenProps) {
  const theme = useAppTheme();
  const strings = useStrings(onboardingStrings);
  const { height, width } = useWindowDimensions();
  const isCompact = height < 720;
  const isTablet = width >= 768;
  const styles = useMemo(
    () => createStyles(theme, { isCompact, isTablet }),
    [isCompact, isTablet, theme],
  );
  const [activeSlide, setActiveSlide] = useState(0);
  const slide = onboardingSlides[activeSlide]!;
  const isFirstSlide = activeSlide === 0;
  const isLastSlide = activeSlide === onboardingSlides.length - 1;

  const slideCopy: Record<OnboardingSlideKey, { body: string; title: string }> = {
    book: { body: strings.slideBookBody, title: strings.slideBookTitle },
    care: { body: strings.slideCareBody, title: strings.slideCareTitle },
    discover: { body: strings.slideDiscoverBody, title: strings.slideDiscoverTitle },
    welcome: { body: strings.subheadline, title: strings.headline },
  };

  const showPreviousSlide = () => setActiveSlide((current) => Math.max(0, current - 1));
  const showNextSlide = () =>
    setActiveSlide((current) => Math.min(onboardingSlides.length - 1, current + 1));

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
      <View style={styles.content}>
        <View style={styles.brandRow}>
          <View accessibilityElementsHidden importantForAccessibility="no" style={styles.brandMark}>
            <DecorativeIcon color={theme.colors.textInverse} name="pulse" size={20} />
          </View>
          <AppText variant="titleSmall">{strings.brandWordmark}</AppText>
          {!isLastSlide && (
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

        <View accessibilityLiveRegion="polite" key={slide.key} style={styles.slide}>
          <View
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
            style={[styles.artworkStage, { backgroundColor: theme.colors[slide.surface] }]}
          >
            <View style={styles.ambientOrb} />
            <View style={styles.ambientOrbSmall} />
            <Image resizeMode="contain" source={slide.illustration} style={styles.artwork} />
          </View>

          <View style={styles.copy}>
            <AppText accessibilityRole="header" variant={isFirstSlide ? 'display' : 'titleLarge'}>
              {slideCopy[slide.key].title}
            </AppText>
            <AppText tone="secondary" variant="bodyLarge">
              {slideCopy[slide.key].body}
            </AppText>
          </View>
        </View>

        <View style={styles.footer}>
          <View
            accessibilityLabel={strings.stepProgress(activeSlide + 1, onboardingSlides.length)}
            accessibilityRole="text"
            accessible
            style={styles.progressRow}
          >
            <AppText tone="secondary" variant="caption">
              {strings.stepProgress(activeSlide + 1, onboardingSlides.length)}
            </AppText>
            <View accessibilityElementsHidden importantForAccessibility="no" style={styles.dots}>
              {onboardingSlides.map((item, index) => (
                <View
                  key={item.key}
                  style={[styles.dot, index === activeSlide && styles.dotActive]}
                />
              ))}
            </View>
          </View>

          {isLastSlide ? (
            <View style={styles.finalActions}>
              <Button accessibilityLabel={strings.finishAccessibilityLabel} onPress={onComplete}>
                {strings.finish}
              </Button>
              <Button onPress={showPreviousSlide} variant="tertiary">
                {strings.back}
              </Button>
            </View>
          ) : (
            <View style={styles.navigationRow}>
              {!isFirstSlide && (
                <View style={styles.backAction}>
                  <Button onPress={showPreviousSlide} variant="secondary">
                    {strings.back}
                  </Button>
                </View>
              )}
              <View style={styles.primaryAction}>
                <Button accessibilityLabel={strings.nextAccessibilityLabel} onPress={showNextSlide}>
                  {strings.next}
                </Button>
              </View>
            </View>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

function createStyles(
  theme: AppTheme,
  { isCompact, isTablet }: { isCompact: boolean; isTablet: boolean },
) {
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
      minHeight: theme.sizes.minimumTouchTarget,
      paddingTop: theme.spacing.xs,
    },
    brandMark: {
      alignItems: 'center',
      backgroundColor: theme.colors.brand,
      borderRadius: theme.radii.sm,
      height: 36,
      justifyContent: 'center',
      marginEnd: theme.spacing.sm,
      transform: [{ rotate: '-5deg' }],
      width: 36,
    },
    skipAction: {
      marginStart: 'auto',
    },
    slide: {
      flex: 1,
      justifyContent: 'center',
      paddingBottom: isCompact ? theme.spacing.sm : theme.spacing.lg,
      paddingTop: isCompact ? theme.spacing.sm : theme.spacing.md,
    },
    artworkStage: {
      alignItems: 'center',
      borderRadius: theme.radii.xl,
      height: isCompact ? 188 : isTablet ? 340 : 270,
      justifyContent: 'center',
      overflow: 'hidden',
      width: '100%',
    },
    ambientOrb: {
      backgroundColor: theme.colors.brandSoft,
      borderRadius: theme.radii.full,
      end: isTablet ? -72 : -52,
      height: isTablet ? 230 : 170,
      opacity: 0.72,
      position: 'absolute',
      top: isTablet ? -90 : -62,
      width: isTablet ? 230 : 170,
    },
    ambientOrbSmall: {
      backgroundColor: theme.colors.surfaceRaised,
      borderRadius: theme.radii.full,
      bottom: isTablet ? -54 : -38,
      height: isTablet ? 140 : 104,
      opacity: 0.46,
      position: 'absolute',
      start: isTablet ? -38 : -28,
      width: isTablet ? 140 : 104,
    },
    artwork: {
      height: '90%',
      width: '88%',
    },
    copy: {
      gap: theme.spacing.sm,
      marginTop: isCompact ? theme.spacing.md : theme.spacing.lg,
      maxWidth: 580,
    },
    footer: {
      gap: isCompact ? theme.spacing.xxs : theme.spacing.xs,
      paddingBottom: theme.spacing.xs,
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
      flexDirection: 'row',
      gap: theme.spacing.sm,
    },
    finalActions: {
      gap: theme.spacing.xs,
    },
    backAction: {
      flex: 1,
    },
    primaryAction: {
      flex: 2,
    },
  });
}
