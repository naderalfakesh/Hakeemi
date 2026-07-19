import type { ViewStyle } from 'react-native';

import { motion, radii, sizes, spacing, typeScale, zIndices } from './tokens';

export type ThemeMode = 'light' | 'dark';

export type SemanticColors = {
  accent: string;
  accentSoft: string;
  borderFocus: string;
  borderStrong: string;
  borderSubtle: string;
  brand: string;
  brandPressed: string;
  brandSoft: string;
  canvas: string;
  danger: string;
  dangerSoft: string;
  info: string;
  infoSoft: string;
  overlay: string;
  success: string;
  successSoft: string;
  surface: string;
  surfaceBrand: string;
  surfaceMuted: string;
  surfaceRaised: string;
  textInverse: string;
  textPrimary: string;
  textSecondary: string;
  warning: string;
  warningSoft: string;
};

type ThemeShadows = {
  floating: ViewStyle;
  raised: ViewStyle;
};

export type AppTheme = {
  colors: SemanticColors;
  mode: ThemeMode;
  motion: typeof motion;
  radii: typeof radii;
  shadows: ThemeShadows;
  sizes: typeof sizes;
  spacing: typeof spacing;
  typeScale: typeof typeScale;
  zIndices: typeof zIndices;
};

const lightColors: SemanticColors = {
  accent: '#B85241',
  accentSoft: '#FAE6E1',
  borderFocus: '#0A6765',
  borderStrong: '#9BB0AB',
  borderSubtle: '#D8E3DF',
  brand: '#0A6765',
  brandPressed: '#07504F',
  brandSoft: '#DCEDEA',
  canvas: '#F5F8F5',
  danger: '#A9333E',
  dangerSoft: '#F8E3E5',
  info: '#315F96',
  infoSoft: '#E3EBF5',
  overlay: 'rgba(6, 28, 27, 0.56)',
  success: '#176B50',
  successSoft: '#DDEEE7',
  surface: '#FBFDFC',
  surfaceBrand: '#E5F2EF',
  surfaceMuted: '#EBF1EE',
  surfaceRaised: '#FFFFFF',
  textInverse: '#FFFFFF',
  textPrimary: '#102726',
  textSecondary: '#506663',
  warning: '#7B570B',
  warningSoft: '#F7EBCB',
};

const darkColors: SemanticColors = {
  accent: '#EB9783',
  accentSoft: '#442923',
  borderFocus: '#72D2CA',
  borderStrong: '#54716C',
  borderSubtle: '#294541',
  brand: '#72D2CA',
  brandPressed: '#91E0D9',
  brandSoft: '#183E3A',
  canvas: '#071A18',
  danger: '#FFABB2',
  dangerSoft: '#43262B',
  info: '#9CC7FA',
  infoSoft: '#20364D',
  overlay: 'rgba(0, 8, 7, 0.72)',
  success: '#84D7B5',
  successSoft: '#193B30',
  surface: '#0D211F',
  surfaceBrand: '#123532',
  surfaceMuted: '#17302D',
  surfaceRaised: '#142B28',
  textInverse: '#062421',
  textPrimary: '#EFF7F4',
  textSecondary: '#B4C7C2',
  warning: '#EBC66C',
  warningSoft: '#403719',
};

const sharedTheme = { motion, radii, sizes, spacing, typeScale, zIndices };

export const lightTheme: AppTheme = {
  ...sharedTheme,
  colors: lightColors,
  mode: 'light',
  shadows: {
    floating: {
      elevation: 8,
      shadowColor: '#173C38',
      shadowOffset: { height: 8, width: 0 },
      shadowOpacity: 0.14,
      shadowRadius: 18,
    },
    raised: {
      elevation: 3,
      shadowColor: '#173C38',
      shadowOffset: { height: 4, width: 0 },
      shadowOpacity: 0.09,
      shadowRadius: 10,
    },
  },
};

export const darkTheme: AppTheme = {
  ...sharedTheme,
  colors: darkColors,
  mode: 'dark',
  shadows: {
    floating: {
      elevation: 8,
      shadowColor: '#000000',
      shadowOffset: { height: 8, width: 0 },
      shadowOpacity: 0.34,
      shadowRadius: 18,
    },
    raised: {
      elevation: 3,
      shadowColor: '#000000',
      shadowOffset: { height: 4, width: 0 },
      shadowOpacity: 0.24,
      shadowRadius: 10,
    },
  },
};

export function getTheme(mode: ThemeMode) {
  return mode === 'dark' ? darkTheme : lightTheme;
}
