import { useMemo } from 'react';
import { Image, StyleSheet, View, type ImageSourcePropType } from 'react-native';

import { useAppTheme, type AppTheme, type SemanticColors } from '@/theme';

type OnboardingArtworkProps = {
  illustration: ImageSourcePropType;
  isCompact: boolean;
  isTablet: boolean;
  surface: keyof SemanticColors;
};

export function OnboardingArtwork({
  illustration,
  isCompact,
  isTablet,
  surface,
}: OnboardingArtworkProps) {
  const theme = useAppTheme();
  const styles = useMemo(
    () => createStyles(theme, { isCompact, isTablet }),
    [isCompact, isTablet, theme],
  );

  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[styles.artworkStage, { backgroundColor: theme.colors[surface] }]}
    >
      <View style={styles.ambientOrb} />
      <View style={styles.ambientOrbSmall} />
      <Image resizeMode="contain" source={illustration} style={styles.artwork} />
    </View>
  );
}

function createStyles(
  theme: AppTheme,
  { isCompact, isTablet }: { isCompact: boolean; isTablet: boolean },
) {
  return StyleSheet.create({
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
  });
}
