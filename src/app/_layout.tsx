import { Stack, ThemeProvider as NavigationThemeProvider } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import '@/config/env';
import { AppText } from '@/components/ui';
import { AuthSessionProvider, useAuthSession } from '@/features/auth/context/auth-session-provider';
import { initializeFirebaseServices } from '@/services/firebase/initialize';
import { AppQueryProvider } from '@/services/query/query-provider';
import { AppThemeProvider, darkNavigationTheme, lightNavigationTheme, useAppTheme } from '@/theme';

initializeFirebaseServices();

function Navigation() {
  const theme = useAppTheme();
  const session = useAuthSession();
  const navigationTheme = theme.mode === 'dark' ? darkNavigationTheme : lightNavigationTheme;

  if (session.status === 'restoring') {
    return (
      <View
        accessibilityLabel="Restoring account session"
        style={[styles.loading, { backgroundColor: theme.colors.canvas }]}
      >
        <ActivityIndicator color={theme.colors.brand} size="large" />
        <AppText tone="secondary" variant="bodyMedium">
          Restoring your session…
        </AppText>
      </View>
    );
  }

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
        <AppQueryProvider>
          <AuthSessionProvider>
            <Navigation />
          </AuthSessionProvider>
        </AppQueryProvider>
      </AppThemeProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  loading: {
    alignItems: 'center',
    flex: 1,
    gap: 12,
    justifyContent: 'center',
  },
});
