import { createContext, useContext, type ReactNode } from 'react';
import { useColorScheme, type ColorSchemeName } from 'react-native';

import { getTheme, type AppTheme } from './themes';

const AppThemeContext = createContext<AppTheme | undefined>(undefined);

type AppThemeProviderProps = {
  children: ReactNode;
  colorScheme?: ColorSchemeName;
};

export function AppThemeProvider({ children, colorScheme }: AppThemeProviderProps) {
  const systemColorScheme = useColorScheme();
  const theme = getTheme((colorScheme ?? systemColorScheme) === 'dark' ? 'dark' : 'light');

  return <AppThemeContext.Provider value={theme}>{children}</AppThemeContext.Provider>;
}

export function useAppTheme() {
  const theme = useContext(AppThemeContext);

  if (!theme) {
    throw new Error('useAppTheme must be used within AppThemeProvider');
  }

  return theme;
}
