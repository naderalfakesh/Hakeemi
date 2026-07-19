import { useEffect, useMemo } from 'react';
import { StyleSheet, type DimensionValue, type ViewStyle } from 'react-native';
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { useAppTheme, type AppTheme } from '@/theme';

type SkeletonProps = {
  height: DimensionValue;
  radius?: keyof AppTheme['radii'];
  style?: ViewStyle;
  width: DimensionValue;
};

export function Skeleton({ height, radius = 'sm', style, width }: SkeletonProps) {
  const theme = useAppTheme();
  const reduceMotion = useReducedMotion();
  const opacity = useSharedValue(0.46);
  const styles = useMemo(() => createStyles(theme, radius), [radius, theme]);
  const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.get() }));

  useEffect(() => {
    if (reduceMotion) {
      opacity.set(0.7);
      return;
    }

    opacity.set(
      withRepeat(withTiming(0.9, { duration: theme.motion.duration.slow * 2 }), -1, true),
    );

    return () => cancelAnimation(opacity);
  }, [opacity, reduceMotion, theme.motion.duration.slow]);

  return (
    <Animated.View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[styles.base, { height, width }, animatedStyle, style]}
    />
  );
}

function createStyles(theme: AppTheme, radius: keyof AppTheme['radii']) {
  return StyleSheet.create({
    base: {
      backgroundColor: theme.colors.surfaceMuted,
      borderRadius: theme.radii[radius],
      overflow: 'hidden',
    },
  });
}
