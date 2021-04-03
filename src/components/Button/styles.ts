import { StyleSheet, ViewStyle } from 'react-native';
import colors from '../../theme/colors';

export type Sizes = 'small' | 'medium' | 'big';
export type Themes = 'primary' | 'secondary' | 'grey';

export default StyleSheet.create({
  base: {
    height: 72,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
  },
});

export const themeStyle: Record<Themes, ViewStyle> = StyleSheet.create({
  primary: {
    backgroundColor: colors.primary,
  },
  secondary: {
    backgroundColor: colors.white,
  },
  grey: {
    backgroundColor: colors.light,
  },
});

export const pressedStyle: Record<Themes, ViewStyle> = StyleSheet.create({
  primary: {
    backgroundColor: colors.light,
  },
  secondary: {
    backgroundColor: colors.secondary,
  },
  grey: {
    backgroundColor: colors.dark,
  },
});
