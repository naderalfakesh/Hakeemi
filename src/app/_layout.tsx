import { Stack, ThemeProvider as NavigationThemeProvider } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import '@/config/env';
import { initializeFirebaseServices } from '@/services/firebase/initialize';
import { AppThemeProvider, darkNavigationTheme, lightNavigationTheme, useAppTheme } from '@/theme';

initializeFirebaseServices();

function Navigation() {
  const theme = useAppTheme();
  const navigationTheme = theme.mode === 'dark' ? darkNavigationTheme : lightNavigationTheme;

  return (
    <NavigationThemeProvider value={navigationTheme}>
      <Stack screenOptions={{ headerShown: false }} />
      <StatusBar style={theme.mode === 'dark' ? 'light' : 'dark'} />
    </NavigationThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={styles.root}>
      <AppThemeProvider>
        <Navigation />
      </AppThemeProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
