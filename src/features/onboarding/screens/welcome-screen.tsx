import { useMemo } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText, BrandMark, Button } from '@/components/ui';
import { useStrings } from '@/localization/use-strings';
import { useAppTheme, useResponsiveLayout, type AppTheme } from '@/theme';

import { welcomeStrings } from '../localization/welcome-strings';

type WelcomeScreenProps = {
  onCreateAccount: () => void;
  onExploreDemo: () => void;
  onSignIn: () => void;
};

export function WelcomeScreen({ onCreateAccount, onExploreDemo, onSignIn }: WelcomeScreenProps) {
  const theme = useAppTheme();
  const strings = useStrings(welcomeStrings);
  const { isCompact, isTablet } = useResponsiveLayout();
  const styles = useMemo(
    () => createStyles(theme, { isCompact, isTablet }),
    [isCompact, isTablet, theme],
  );

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
      <View style={styles.content}>
        <View style={styles.brandRow}>
          <BrandMark />
          <AppText variant="titleSmall">{strings.brandWordmark}</AppText>
        </View>

        <View style={styles.hero}>
          <View
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
            style={styles.artworkStage}
          >
            <View style={styles.ambientOrb} />
            <View style={styles.ambientOrbSmall} />
            <Image
              resizeMode="contain"
              source={require('../../../../assets/illustrations/welcome-hero.webp')}
              style={styles.artwork}
            />
          </View>

          <View style={styles.copy}>
            <AppText accessibilityRole="header" variant="display">
              {strings.headline}
            </AppText>
            <AppText tone="secondary" variant="bodyLarge">
              {strings.subheadline}
            </AppText>
          </View>
        </View>

        <View style={styles.actions}>
          <Button
            accessibilityLabel={strings.exploreDemoAccessibilityLabel}
            onPress={onExploreDemo}
          >
            {strings.exploreDemo}
          </Button>
          <AppText style={styles.demoHint} tone="secondary" variant="caption">
            {strings.exploreDemoHint}
          </AppText>
          <Button onPress={onCreateAccount} variant="secondary">
            {strings.createAccount}
          </Button>
          <Button onPress={onSignIn} variant="tertiary">
            {strings.signIn}
          </Button>
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
      gap: theme.spacing.sm,
      minHeight: theme.sizes.minimumTouchTarget,
      paddingTop: theme.spacing.xs,
    },
    hero: {
      flex: 1,
      justifyContent: 'center',
      paddingVertical: isCompact ? theme.spacing.sm : theme.spacing.lg,
    },
    artworkStage: {
      alignItems: 'center',
      backgroundColor: theme.colors.surfaceBrand,
      borderRadius: theme.radii.xl,
      height: isCompact ? 190 : isTablet ? 360 : 290,
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
      height: '92%',
      width: '88%',
    },
    copy: {
      gap: theme.spacing.sm,
      marginTop: isCompact ? theme.spacing.md : theme.spacing.lg,
      maxWidth: 580,
    },
    actions: {
      gap: theme.spacing.xs,
      paddingBottom: theme.spacing.xs,
    },
    demoHint: {
      marginBottom: theme.spacing.xs,
      textAlign: 'center',
    },
  });
}
