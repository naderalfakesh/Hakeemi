import { DarkTheme, DefaultTheme } from 'expo-router';

import { darkTheme, lightTheme } from './themes';

export const lightNavigationTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: lightTheme.colors.canvas,
    border: lightTheme.colors.borderSubtle,
    card: lightTheme.colors.surfaceRaised,
    notification: lightTheme.colors.accent,
    primary: lightTheme.colors.brand,
    text: lightTheme.colors.textPrimary,
  },
};

export const darkNavigationTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: darkTheme.colors.canvas,
    border: darkTheme.colors.borderSubtle,
    card: darkTheme.colors.surfaceRaised,
    notification: darkTheme.colors.accent,
    primary: darkTheme.colors.brand,
    text: darkTheme.colors.textPrimary,
  },
};
