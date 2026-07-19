import type { TextStyle } from 'react-native';

export const spacing = {
  none: 0,
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
} as const;

export const radii = {
  xs: 6,
  sm: 10,
  md: 14,
  lg: 18,
  xl: 26,
  full: 999,
} as const;

export const sizes = {
  contentMaxWidth: 680,
  controlHeight: 52,
  iconButton: 48,
  minimumTouchTarget: 44,
} as const;

export const motion = {
  duration: {
    instant: 80,
    fast: 160,
    normal: 220,
    slow: 320,
  },
  spring: {
    damping: 18,
    mass: 0.9,
    stiffness: 190,
  },
} as const;

export const typeScale = {
  display: {
    fontSize: 40,
    fontWeight: '700',
    letterSpacing: -1.2,
    lineHeight: 44,
  },
  titleLarge: {
    fontSize: 30,
    fontWeight: '700',
    letterSpacing: -0.7,
    lineHeight: 36,
  },
  titleMedium: {
    fontSize: 22,
    fontWeight: '600',
    letterSpacing: -0.3,
    lineHeight: 28,
  },
  titleSmall: {
    fontSize: 18,
    fontWeight: '600',
    lineHeight: 24,
  },
  bodyLarge: {
    fontSize: 17,
    fontWeight: '400',
    lineHeight: 26,
  },
  bodyMedium: {
    fontSize: 15,
    fontWeight: '400',
    lineHeight: 22,
  },
  bodyStrong: {
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 22,
  },
  labelLarge: {
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.1,
    lineHeight: 20,
  },
  labelSmall: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.2,
    lineHeight: 16,
  },
  caption: {
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
  },
} as const satisfies Record<string, TextStyle>;

export const zIndices = {
  base: 0,
  sticky: 10,
  overlay: 20,
  modal: 30,
  toast: 40,
} as const;
