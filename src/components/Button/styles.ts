import { StyleSheet, ViewStyle } from 'react-native';
import colors, { palette } from '../../theme/colors';
import spacing from '../../theme/spacing';

export type Sizes = 'small' | 'medium' | 'big';
export type Themes = 'primary' | 'secondary' | 'grey';

export default StyleSheet.create({
  base: {
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
    backgroundColor: palette.primary.dark,
  },
  secondary: {
    backgroundColor: colors.secondary,
  },
  grey: {
    backgroundColor: colors.dark,
  },
});

export const sizeStyle: Record<Sizes, ViewStyle> = StyleSheet.create({
  small: {
    padding: spacing.small1,
  },
  medium: {
    padding: spacing.small3,
  },
  big: {
    padding: spacing.medium1,
  },
});
