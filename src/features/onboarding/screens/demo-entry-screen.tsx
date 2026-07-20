import { useMemo, useState } from 'react';
import {
  Image,
  ScrollView,
  StyleSheet,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText, Button, DecorativeIcon, Illustration, Surface } from '@/components/ui';
import { useStrings } from '@/localization/use-strings';
import { useAppTheme, type AppTheme } from '@/theme';

import { onboardingStrings } from '../localization/onboarding-strings';

const welcomeHero = require('../../../../assets/illustrations/welcome-hero.png');

const storySlides = [
  {
    illustration: require('../../../../assets/illustrations/onboarding-discover.png'),
    key: 'discover',
  },
  {
    illustration: require('../../../../assets/illustrations/onboarding-book.png'),
    key: 'book',
  },
  {
    illustration: require('../../../../assets/illustrations/onboarding-care.png'),
    key: 'care',
  },
] as const;

type StorySlideKey = (typeof storySlides)[number]['key'];

type DemoEntryScreenProps = {
  onContinue: () => void;
  onSignIn: () => void;
};

export function DemoEntryScreen({ onContinue, onSignIn }: DemoEntryScreenProps) {
  const theme = useAppTheme();
  const strings = useStrings(onboardingStrings);
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [pagerWidth, setPagerWidth] = useState(0);
  const [activeSlide, setActiveSlide] = useState(0);

  const slideCopy: Record<StorySlideKey, { body: string; title: string }> = {
    book: { body: strings.slideBookBody, title: strings.slideBookTitle },
    care: { body: strings.slideCareBody, title: strings.slideCareTitle },
    discover: { body: strings.slideDiscoverBody, title: strings.slideDiscoverTitle },
  };

  const handleMomentumEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (pagerWidth > 0) {
      const page = Math.round(event.nativeEvent.contentOffset.x / pagerWidth);
      setActiveSlide(Math.min(storySlides.length - 1, Math.max(0, page)));
    }
  };

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
      <ScrollView
        bounces={false}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.brandRow}>
          <View accessibilityElementsHidden importantForAccessibility="no" style={styles.brandMark}>
            <DecorativeIcon color={theme.colors.textInverse} name="pulse" size={22} />
          </View>
          <AppText variant="titleSmall">{strings.brandWordmark}</AppText>
          <AppText style={styles.rebuildLabel} tone="secondary" variant="caption">
            {strings.rebuiltIn}
          </AppText>
        </View>

        <View
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          style={styles.heroStage}
        >
          <View style={styles.ambientOrb} />
          <View style={styles.ambientOrbSmall} />
          <Image resizeMode="contain" source={welcomeHero} style={styles.heroImage} />
        </View>

        <View style={styles.message}>
          <AppText accessibilityRole="header" variant="display">
            {strings.headline}
          </AppText>
          <AppText tone="secondary" variant="bodyLarge">
            {strings.subheadline}
          </AppText>
        </View>

        <View
          onLayout={(event) => setPagerWidth(event.nativeEvent.layout.width)}
          style={styles.pager}
        >
          <ScrollView
            decelerationRate="fast"
            horizontal
            onMomentumScrollEnd={handleMomentumEnd}
            pagingEnabled
            showsHorizontalScrollIndicator={false}
          >
            {storySlides.map((slide) => (
              <Surface
                key={slide.key}
                padding="spacious"
                style={[styles.slide, pagerWidth > 0 && { width: pagerWidth }]}
                variant="muted"
              >
                <Illustration backdrop={false} size={132} source={slide.illustration} />
                <View style={styles.slideCopy}>
                  <AppText style={styles.slideTitle} variant="titleSmall">
                    {slideCopy[slide.key].title}
                  </AppText>
                  <AppText style={styles.slideTitle} tone="secondary" variant="bodyMedium">
                    {slideCopy[slide.key].body}
                  </AppText>
                </View>
              </Surface>
            ))}
          </ScrollView>
          <View accessibilityElementsHidden importantForAccessibility="no" style={styles.dots}>
            {storySlides.map((slide, index) => (
              <View
                key={slide.key}
                style={[styles.dot, index === activeSlide && styles.dotActive]}
              />
            ))}
          </View>
        </View>

        <View style={styles.actions}>
          <Button accessibilityLabel={strings.exploreDemoAccessibilityLabel} onPress={onContinue}>
            {strings.exploreDemo}
          </Button>
          <Button onPress={onSignIn} variant="secondary">
            {strings.signIn}
          </Button>
          <AppText style={styles.disclaimer} tone="secondary" variant="caption">
            {strings.disclaimer}
          </AppText>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function createStyles(theme: AppTheme) {
  return StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: theme.colors.canvas,
    },
    content: {
      alignSelf: 'center',
      maxWidth: theme.sizes.contentMaxWidth,
      paddingBottom: theme.spacing.xl,
      paddingHorizontal: theme.spacing.lg,
      paddingTop: theme.spacing.md,
      width: '100%',
    },
    brandRow: {
      alignItems: 'center',
      flexDirection: 'row',
      minHeight: theme.sizes.minimumTouchTarget,
    },
    brandMark: {
      alignItems: 'center',
      backgroundColor: theme.colors.brand,
      borderRadius: theme.radii.sm,
      height: 40,
      justifyContent: 'center',
      marginEnd: theme.spacing.sm,
      transform: [{ rotate: '-5deg' }],
      width: 40,
    },
    rebuildLabel: {
      marginStart: 'auto',
    },
    heroStage: {
      alignItems: 'center',
      backgroundColor: theme.colors.surfaceBrand,
      borderRadius: theme.radii.xl,
      marginTop: theme.spacing.lg,
      overflow: 'hidden',
      paddingBottom: 0,
      paddingTop: theme.spacing.md,
    },
    ambientOrb: {
      backgroundColor: theme.colors.brandSoft,
      borderRadius: theme.radii.full,
      end: -60,
      height: 210,
      position: 'absolute',
      top: -72,
      width: 210,
    },
    ambientOrbSmall: {
      backgroundColor: theme.colors.accentSoft,
      borderRadius: theme.radii.full,
      bottom: -34,
      height: 110,
      position: 'absolute',
      start: -30,
      width: 110,
    },
    heroImage: {
      height: 240,
      width: '86%',
    },
    message: {
      gap: theme.spacing.sm,
      marginTop: theme.spacing.xl,
    },
    pager: {
      marginTop: theme.spacing.lg,
    },
    slide: {
      alignItems: 'center',
      gap: theme.spacing.sm,
    },
    slideCopy: {
      gap: theme.spacing.xxs,
    },
    slideTitle: {
      textAlign: 'center',
    },
    dots: {
      alignSelf: 'center',
      flexDirection: 'row',
      gap: theme.spacing.xs,
      marginTop: theme.spacing.sm,
    },
    dot: {
      backgroundColor: theme.colors.brandSoft,
      borderRadius: theme.radii.full,
      height: 8,
      width: 8,
    },
    dotActive: {
      backgroundColor: theme.colors.brand,
      width: 20,
    },
    actions: {
      gap: theme.spacing.md,
      marginTop: theme.spacing.xl,
    },
    disclaimer: {
      alignSelf: 'center',
      maxWidth: 480,
      textAlign: 'center',
    },
  });
}
