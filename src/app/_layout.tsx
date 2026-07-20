import { Stack, ThemeProvider as NavigationThemeProvider, useRouter, type Href } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useRef } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import '@/config/env';
import { AppText } from '@/components/ui';
import { AuthSessionProvider, useAuthSession } from '@/features/auth/context/auth-session-provider';
import { BookingDraftProvider } from '@/features/booking/context/booking-draft-provider';
import { NotificationRegistrationProvider } from '@/features/notifications/context/notification-registration-provider';
import {
  AppPreferencesProvider,
  useAppPreferences,
} from '@/features/preferences/context/app-preferences-provider';
import { initializeFirebaseServices } from '@/services/firebase/initialize';
import { subscribeToAppointmentNotificationOpen } from '@/services/notifications/notifications';
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
  const { preferences } = useAppPreferences();

  return (
    <AppThemeProvider preference={preferences.theme}>
      <Navigation />
    </AppThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={styles.root}>
      <AppQueryProvider>
        <AuthSessionProvider>
          <BookingDraftProvider>
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
  loading: {
    alignItems: 'center',
    flex: 1,
    gap: 12,
    justifyContent: 'center',
  },
});
