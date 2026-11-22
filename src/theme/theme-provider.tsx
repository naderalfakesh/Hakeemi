import { createContext, useContext, useEffect, type ReactNode } from 'react';
import { Appearance, useColorScheme, type ColorSchemeName } from 'react-native';

import { getTheme, type AppTheme, type ThemePreference } from './themes';

const AppThemeContext = createContext<AppTheme | undefined>(undefined);

type AppThemeProviderProps = {
  children: ReactNode;
  colorScheme?: ColorSchemeName;
  preference?: ThemePreference;
};

export function AppThemeProvider({
  children,
  colorScheme,
  preference = 'system',
}: AppThemeProviderProps) {
  const systemColorScheme = useColorScheme();

  // The system draws the status bar, tab bar glass, keyboard and alerts from
  // the native appearance, so an in-app Light or Dark choice has to override
  // it too. 'auto' hands control back to the device setting.
  useEffect(() => {
    Appearance.setColorScheme(preference === 'system' ? 'auto' : preference);
  }, [preference]);
  const preferredColorScheme = preference === 'system' ? systemColorScheme : preference;
  const theme = getTheme((colorScheme ?? preferredColorScheme) === 'dark' ? 'dark' : 'light');

  return <AppThemeContext.Provider value={theme}>{children}</AppThemeContext.Provider>;
}

export function useAppTheme() {
  const theme = useContext(AppThemeContext);

  if (!theme) {
    throw new Error('useAppTheme must be used within AppThemeProvider');
  }

  return theme;
}
