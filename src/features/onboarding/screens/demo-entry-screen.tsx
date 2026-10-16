import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import {
  Image,
  ScrollView,
  StyleSheet,
  View,
  useWindowDimensions,
  type ImageSourcePropType,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  AppText,
  BrandMark,
  Button,
  Chip,
  DecorativeIcon,
  type DecorativeIconName,
} from '@/components/ui';
import type { AppPreferences } from '@/features/preferences/domain/preferences';
import { useAppLocale } from '@/localization/locale-provider';
import { useStrings } from '@/localization/use-strings';
import { useAppMotion, useAppTheme, type AppTheme, type SemanticColors } from '@/theme';

import { onboardingStrings } from '../localization/onboarding-strings';

const onboardingSteps = [
  { key: 'personalize' },
  {
    illustration: require('../../../../assets/illustrations/onboarding-discover.webp'),
    key: 'journey',
    surface: 'infoSoft',
  },
  {
    illustration: require('../../../../assets/illustrations/onboarding-care.webp'),
    key: 'permissions',
    surface: 'successSoft',
  },
] as const satisfies readonly {
  illustration?: ImageSourcePropType;
  key: 'journey' | 'permissions' | 'personalize';
  surface?: keyof SemanticColors;
}[];

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
  const { isRTL } = useAppLocale();
  const { prefersReducedMotion } = useAppMotion();
  const { fontScale, height, width } = useWindowDimensions();
  const isCompact = height < 720;
  const isTablet = width >= 768;
  // At accessibility text sizes the Back/Next pair no longer fits side by side.
  const stackActions = fontScale >= 1.5;
  const styles = useMemo(
    () => createStyles(theme, { isCompact, isTablet, stackActions }),
    [isCompact, isTablet, stackActions, theme],
  );
  const [activeStep, setActiveStep] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);
  const activeStepRef = useRef(activeStep);
  const pageWidth = Math.min(width, theme.sizes.contentMaxWidth) - theme.spacing.lg * 2;
  // The horizontal ScrollView row is already visually reversed by the native
  // RTL layout, and getPhysicalIndex maps logical -> physical offsets for it.
  // Reversing the step array as well would cancel that mapping out.
  const isFirstStep = activeStep === 0;
  const isLastStep = activeStep === onboardingSteps.length - 1;

  const getPhysicalIndex = useCallback(
    (logicalIndex: number) => (isRTL ? onboardingSteps.length - 1 - logicalIndex : logicalIndex),
    [isRTL],
  );
  const showStep = useCallback(
    (logicalIndex: number) => {
      const nextIndex = Math.max(0, Math.min(onboardingSteps.length - 1, logicalIndex));
      activeStepRef.current = nextIndex;
      setActiveStep(nextIndex);
      scrollViewRef.current?.scrollTo({
        animated: !prefersReducedMotion,
        x: getPhysicalIndex(nextIndex) * pageWidth,
        y: 0,
      });
    },
    [getPhysicalIndex, pageWidth, prefersReducedMotion],
  );
  const showPreviousStep = () => showStep(activeStep - 1);
  const showNextStep = () => showStep(activeStep + 1);
  const handleMomentumScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const physicalIndex = Math.max(
      0,
      Math.min(
        onboardingSteps.length - 1,
        Math.round(event.nativeEvent.contentOffset.x / pageWidth),
      ),
    );
    const logicalIndex = isRTL ? onboardingSteps.length - 1 - physicalIndex : physicalIndex;
    activeStepRef.current = logicalIndex;
    setActiveStep(logicalIndex);
  };

  useEffect(() => {
    scrollViewRef.current?.scrollTo({
      animated: false,
      x: getPhysicalIndex(activeStepRef.current) * pageWidth,
      y: 0,
    });
  }, [getPhysicalIndex, pageWidth]);

  const stepContent: Record<(typeof onboardingSteps)[number]['key'], ReactNode> = {
    personalize: (
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
          <PreferenceChoices
            label={strings.language}
            onChange={(locale) => onUpdatePreferences({ ...preferences, locale })}
            options={[
              { label: strings.languageEnglish, language: 'en', value: 'en' },
              { label: strings.languageArabic, language: 'ar', value: 'ar' },
            ]}
            styles={styles}
            value={preferences.locale}
          />
          <PreferenceChoices
            label={strings.appearance}
            onChange={(themePreference) =>
              onUpdatePreferences({ ...preferences, theme: themePreference })
            }
            options={[
              { label: strings.appearanceSystem, value: 'system' },
              { label: strings.appearanceLight, value: 'light' },
              { label: strings.appearanceDark, value: 'dark' },
            ]}
            styles={styles}
            value={preferences.theme}
          />
          <AppText tone="secondary" variant="caption">
            {strings.languageReloadNote}
          </AppText>
        </View>
      </>
    ),
    journey: (
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
          <FeatureRow icon="search-outline" styles={styles} text={strings.journeyFind} />
          <FeatureRow icon="time-outline" styles={styles} text={strings.journeyCompare} />
          <FeatureRow icon="checkmark-circle-outline" styles={styles} text={strings.journeyBook} />
        </View>
      </>
    ),
    permissions: (
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
          <FeatureRow icon="calendar-outline" styles={styles} text={strings.permissionsCalendar} />
          <FeatureRow
            icon="notifications-outline"
            styles={styles}
            text={strings.permissionsNotifications}
          />
          <FeatureRow icon="options-outline" styles={styles} text={strings.permissionsChange} />
        </View>
      </>
    ),
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
          contentOffset={{ x: getPhysicalIndex(0) * pageWidth, y: 0 }}
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
                  <View
                    accessibilityElementsHidden
                    importantForAccessibility="no-hide-descendants"
                    style={[styles.artworkStage, { backgroundColor: theme.colors[step.surface] }]}
                  >
                    <View style={styles.ambientOrb} />
                    <View style={styles.ambientOrbSmall} />
                    <Image resizeMode="contain" source={step.illustration} style={styles.artwork} />
                  </View>
                )}
                {stepContent[step.key]}
              </ScrollView>
            );
          })}
        </ScrollView>

        <View style={styles.footer}>
          <View
            accessibilityLabel={strings.stepProgress(activeStep + 1, onboardingSteps.length)}
            accessibilityRole="text"
            accessible
            style={styles.progressRow}
          >
            <AppText tone="secondary" variant="caption">
              {strings.stepProgress(activeStep + 1, onboardingSteps.length)}
            </AppText>
            <View accessibilityElementsHidden importantForAccessibility="no" style={styles.dots}>
              {onboardingSteps.map((step, index) => (
                <View
                  key={step.key}
                  style={[styles.dot, index === activeStep && styles.dotActive]}
                />
              ))}
            </View>
          </View>

          {isLastStep ? (
            <View style={styles.finalActions}>
              <Button accessibilityLabel={strings.finishAccessibilityLabel} onPress={onComplete}>
                {strings.finish}
              </Button>
              <Button onPress={showPreviousStep} variant="tertiary">
                {strings.back}
              </Button>
            </View>
          ) : (
            <View style={styles.navigationRow}>
              {!isFirstStep && (
                <View style={styles.backAction}>
                  <Button onPress={showPreviousStep} variant="secondary">
                    {strings.back}
                  </Button>
                </View>
              )}
              <View style={styles.primaryAction}>
                <Button accessibilityLabel={strings.nextAccessibilityLabel} onPress={showNextStep}>
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

type Styles = ReturnType<typeof createStyles>;

function PreferenceChoices<Value extends string>({
  label,
  onChange,
  options,
  styles,
  value,
}: {
  label: string;
  onChange: (value: Value) => void;
  options: readonly { label: string; language?: string; value: Value }[];
  styles: Styles;
  value: Value;
}) {
  return (
    <View style={styles.preferenceGroup}>
      <AppText variant="bodyStrong">{label}</AppText>
      <View
        accessibilityLabel={label}
        accessibilityRole="radiogroup"
        style={styles.preferenceOptions}
      >
        {options.map((option) => (
          <Chip
            accessibilityLanguage={option.language}
            accessibilityRole="radio"
            accessibilityState={{ checked: option.value === value }}
            key={option.value}
            label={option.label}
            onPress={() => onChange(option.value)}
            selected={option.value === value}
          />
        ))}
      </View>
    </View>
  );
}

function FeatureRow({
  icon,
  styles,
  text,
}: {
  icon: DecorativeIconName;
  styles: Styles;
  text: string;
}) {
  const theme = useAppTheme();

  return (
    <View style={styles.row}>
      <View style={styles.rowIcon}>
        <DecorativeIcon color={theme.colors.brand} name={icon} size={20} />
      </View>
      <AppText style={styles.rowText} variant="bodyMedium">
        {text}
      </AppText>
    </View>
  );
}

function createStyles(
  theme: AppTheme,
  {
    isCompact,
    isTablet,
    stackActions,
  }: { isCompact: boolean; isTablet: boolean; stackActions: boolean },
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
    artworkStage: {
      alignItems: 'center',
      borderRadius: theme.radii.xl,
      height: isCompact ? 176 : isTablet ? 320 : 240,
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
      maxWidth: 580,
    },
    preferenceCard: {
      backgroundColor: theme.colors.surfaceBrand,
      borderRadius: theme.radii.xl,
      gap: theme.spacing.md,
      padding: theme.spacing.lg,
    },
    preferenceGroup: {
      gap: theme.spacing.xs,
    },
    preferenceOptions: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: theme.spacing.xs,
    },
    rows: {
      gap: theme.spacing.sm,
    },
    row: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: theme.spacing.sm,
    },
    rowIcon: {
      alignItems: 'center',
      backgroundColor: theme.colors.brandSoft,
      borderRadius: theme.radii.full,
      height: 40,
      justifyContent: 'center',
      width: 40,
    },
    rowText: {
      flex: 1,
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
      flexDirection: stackActions ? 'column-reverse' : 'row',
      gap: stackActions ? theme.spacing.xs : theme.spacing.sm,
    },
    finalActions: {
      gap: theme.spacing.xs,
    },
    backAction: {
      flex: stackActions ? 0 : 1,
    },
    primaryAction: {
      flex: stackActions ? 0 : 2,
    },
  });
}
