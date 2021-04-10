import { StyleSheet, TextStyle } from 'react-native';
import colors, { palette } from '../../theme/colors';

export type Color =
  | 'primary'
  | 'secondary'
  | 'light'
  | 'dark'
  | 'white'
  | 'black';

export type Size = 'button-22' | 'body-16' | 'body-22' | 'head-30';

export default StyleSheet.create({
  base: {
    // fontFamily: 'system',
    includeFontPadding: false,
  },
});

export const sizeTheme: Record<Size, TextStyle> = StyleSheet.create({
  'body-16': {
    fontSize: 16,
    lineHeight: 20,
  },
  'body-22': {
    fontSize: 22,
    lineHeight: 24,
  },
  'button-22': {
    fontSize: 22,
    lineHeight: 28,
  },
  'head-30': {
    fontSize: 30,
    lineHeight: 38,
  },
});

export const colorTheme: Record<Color, TextStyle> = StyleSheet.create({
  primary: {
    color: colors.primary,
  },
  secondary: {
    color: palette.primary.dark,
  },
  light: {
    color: colors.light,
  },
  dark: {
    color: colors.dark,
  },
  white: {
    color: colors.white,
  },
  black: {
    color: colors.black,
  },
});
