import { Stack, ThemeProvider as NavigationThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import '@/config/env';
import { ErrorBoundaryScreen } from '@/components/navigation/error-boundary-screen';
import { LaunchGate } from '@/components/navigation/launch-gate';
import { navigationStrings } from '@/components/navigation/navigation-strings';
import { AccountDataReset } from '@/features/auth/context/account-data-reset';
import { AuthSessionProvider, useAuthSession } from '@/features/auth/context/auth-session-provider';
import { BookingDraftProvider } from '@/features/booking/context/booking-draft-provider';
import { NotificationNavigationBridge } from '@/features/notifications/components/notification-navigation-bridge';
import { NotificationRegistrationProvider } from '@/features/notifications/context/notification-registration-provider';
import {
  AppPreferencesProvider,
  useAppPreferences,
} from '@/features/preferences/context/app-preferences-provider';
import { initializeFirebaseServices } from '@/services/firebase/initialize';
import { disableAppointmentNotifications } from '@/services/notifications/notifications';
import { AppQueryProvider } from '@/services/query/query-provider';
import {
  AppThemeProvider,
  darkNavigationTheme,
  lightNavigationTheme,
  useAppMotion,
  useAppTheme,
} from '@/theme';
import { logSafeError } from '@/services/logging/safe-logger';
import { AppLocaleProvider } from '@/localization/locale-provider';
import { useLayoutDirectionSync } from '@/localization/use-layout-direction-sync';
import { useStrings } from '@/localization/use-strings';

initializeFirebaseServices();

void SplashScreen.preventAutoHideAsync().catch(() => undefined);
const SPLASH_HANDOFF_LIMIT_MS = 3000;

function hideSplash(fade: boolean, duration: number) {
  SplashScreen.setOptions({ duration: fade ? duration : 0, fade });
  void SplashScreen.hideAsync().catch(() => undefined);
}

export function ErrorBoundary({ error, retry }: { error: Error; retry: () => void }) {
  logSafeError('route-boundary', error);
  hideSplash(false, 0);
  return <ErrorBoundaryScreen error={error} onRetry={retry} />;
}

function Navigation() {
  const theme = useAppTheme();
  const session = useAuthSession();
  const strings = useStrings(navigationStrings);
  const { duration, prefersReducedMotion } = useAppMotion();
  const navigationTheme = theme.mode === 'dark' ? darkNavigationTheme : lightNavigationTheme;
  const isRestoring = session.status === 'restoring';

  useEffect(() => {
    if (!isRestoring) {
      hideSplash(!prefersReducedMotion, duration.slow);
      return;
    }

    const handoff = setTimeout(() => hideSplash(false, 0), SPLASH_HANDOFF_LIMIT_MS);
    return () => clearTimeout(handoff);
  }, [duration.slow, isRestoring, prefersReducedMotion]);

  if (isRestoring) {
    return (
      <LaunchGate
        accessibilityLabel={strings.restoringSession.accessibilityLabel}
        message={strings.restoringSession.message}
      />
    );
  }

  const entryAnimation = prefersReducedMotion ? 'none' : 'fade';

  return (
    <NavigationThemeProvider value={navigationTheme}>
      <Stack
        screenOptions={{
          animation: prefersReducedMotion ? 'none' : 'default',
          headerShown: false,
          // iOS reads statusBarStyle from the screen view controller; <StatusBar> only affects Android.
          statusBarStyle: theme.mode === 'dark' ? 'light' : 'dark',
        }}
      >
        <Stack.Protected guard={session.status === 'anonymous'}>
          <Stack.Screen name="onboarding" options={{ animation: entryAnimation }} />
          <Stack.Screen name="welcome" options={{ animation: entryAnimation }} />
        </Stack.Protected>
        <Stack.Screen name="(tabs)" options={{ animation: entryAnimation }} />
        <Stack.Screen name="booking" options={{ presentation: 'modal' }} />
      </Stack>
      <NotificationNavigationBridge />
      <StatusBar style={theme.mode === 'dark' ? 'light' : 'dark'} />
    </NavigationThemeProvider>
  );
}

function AppShell() {
  const { preferences, status } = useAppPreferences();

  useLayoutDirectionSync(preferences.locale, status === 'ready');

  return (
    <AppLocaleProvider locale={preferences.locale}>
      <AppThemeProvider preference={preferences.theme}>
        <Navigation />
      </AppThemeProvider>
    </AppLocaleProvider>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={styles.root}>
      <AppQueryProvider>
        <AuthSessionProvider onBeforeSignOut={disableAppointmentNotifications}>
          <BookingDraftProvider>
            <AccountDataReset />
            <AppPreferencesProvider>
              <NotificationRegistrationProvider>
                <AppShell />
              </NotificationRegistrationProvider>
            </AppPreferencesProvider>
          </BookingDraftProvider>
        </AuthSessionProvider>
      </AppQueryProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
