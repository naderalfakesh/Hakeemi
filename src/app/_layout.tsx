import { Stack, ThemeProvider as NavigationThemeProvider, useRouter, type Href } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useRef } from 'react';
import { StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import '@/config/env';
import { ErrorBoundaryScreen } from '@/components/navigation/error-boundary-screen';
import { LaunchGate } from '@/components/navigation/launch-gate';
import { navigationStrings } from '@/components/navigation/navigation-strings';
import { AccountDataReset } from '@/features/auth/context/account-data-reset';
import { AuthSessionProvider, useAuthSession } from '@/features/auth/context/auth-session-provider';
import { BookingDraftProvider } from '@/features/booking/context/booking-draft-provider';
import { NotificationRegistrationProvider } from '@/features/notifications/context/notification-registration-provider';
import {
  AppPreferencesProvider,
  useAppPreferences,
} from '@/features/preferences/context/app-preferences-provider';
import { initializeFirebaseServices } from '@/services/firebase/initialize';
import {
  disableAppointmentNotifications,
  subscribeToAppointmentNotificationOpen,
} from '@/services/notifications/notifications';
import { AppQueryProvider } from '@/services/query/query-provider';
import {
  AppThemeProvider,
  darkNavigationTheme,
  lightNavigationTheme,
  useAppMotion,
  useAppTheme,
} from '@/theme';
import { logSafeError } from '@/services/logging/safe-logger';
import {
  isLayoutDirectionPendingRestart,
  restartToApplyLayoutDirection,
  syncNativeLayoutDirection,
} from '@/localization/layout-direction';
import { AppLocaleProvider } from '@/localization/locale-provider';
import { useStrings } from '@/localization/use-strings';

initializeFirebaseServices();

// The native splash stays up until the session has restored, so launch goes
// straight from the splash tile to the first routed screen. If restoration
// is unusually slow the in-app gate takes over instead.
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

  // Screens the launch gate resolves into fade in so the brand tile hands
  // off in place instead of sliding the whole screen in from the side.
  const entryAnimation = prefersReducedMotion ? 'none' : 'fade';

  return (
    <NavigationThemeProvider value={navigationTheme}>
      <Stack
        screenOptions={{
          animation: prefersReducedMotion ? 'none' : 'default',
          headerShown: false,
        }}
      >
        <Stack.Screen name="onboarding" options={{ animation: entryAnimation }} />
        <Stack.Screen name="welcome" options={{ animation: entryAnimation }} />
        <Stack.Screen name="(tabs)" options={{ animation: entryAnimation }} />
      </Stack>
      <NotificationNavigationBridge />
      <StatusBar style={theme.mode === 'dark' ? 'light' : 'dark'} />
    </NavigationThemeProvider>
  );
}

function NotificationNavigationBridge() {
  const router = useRouter();
  const session = useAuthSession();
  const pendingAppointmentId = useRef<string | null>(null);
  const openAppointment = useCallback(
    (appointmentId: string) => {
      if (session.status !== 'authenticated') {
        pendingAppointmentId.current = appointmentId;
        return;
      }

      router.push({
        pathname: '/appointments/[appointmentId]',
        params: { appointmentId },
      } as unknown as Href);
    },
    [router, session.status],
  );

  useEffect(() => subscribeToAppointmentNotificationOpen(openAppointment), [openAppointment]);

  useEffect(() => {
    if (session.status === 'authenticated' && pendingAppointmentId.current) {
      const appointmentId = pendingAppointmentId.current;
      pendingAppointmentId.current = null;
      router.push({
        pathname: '/appointments/[appointmentId]',
        params: { appointmentId },
      } as unknown as Href);
    }
  }, [router, session.status]);

  return null;
}

function AppShell() {
  const { preferences, status } = useAppPreferences();
  const hasRequestedRestart = useRef(false);

  useEffect(() => {
    syncNativeLayoutDirection(preferences.locale);
  }, [preferences.locale]);

  useEffect(() => {
    // Reload the app once the changed locale is persisted so the new layout
    // direction applies without a manual restart. The persisted RTL flag is
    // already in place, so the reloaded instance boots in the right direction.
    if (
      status !== 'ready' ||
      hasRequestedRestart.current ||
      !isLayoutDirectionPendingRestart(preferences.locale)
    ) {
      return;
    }

    hasRequestedRestart.current = true;
    void restartToApplyLayoutDirection();
  }, [preferences.locale, status]);

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
