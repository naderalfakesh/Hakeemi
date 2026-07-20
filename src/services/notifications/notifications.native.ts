import { getApp } from '@react-native-firebase/app';
import { getMessaging, getToken, onTokenRefresh } from '@react-native-firebase/messaging';
import { getFunctions, httpsCallable } from '@react-native-firebase/functions';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { notificationRegistrationResultSchema } from '@/features/notifications/domain/schemas';

import type { NotificationRegistrationInput, NotificationSetupResult } from './notifications';

const FUNCTIONS_REGION = 'me-central1';
const APPOINTMENT_REMINDER_CHANNEL = 'appointment-reminders';

let stopTokenRefresh: (() => void) | null = null;

export async function registerForAppointmentNotifications({
  locale,
}: NotificationRegistrationInput): Promise<NotificationSetupResult> {
  stopNotificationTokenRefresh();

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(APPOINTMENT_REMINDER_CHANNEL, {
      description: 'Non-sensitive reminders about fictional Hakeemi appointments.',
      importance: Notifications.AndroidImportance.DEFAULT,
      name: 'Appointment reminders',
      vibrationPattern: [0, 250, 250, 250],
    });
  }

  const currentPermission = await Notifications.getPermissionsAsync();
  const permission = currentPermission.granted
    ? currentPermission
    : await Notifications.requestPermissionsAsync();

  if (!permission.granted) {
    return { status: 'denied' };
  }

  const messaging = getMessaging(getApp());
  const token = await getToken(messaging);

  if (!token) {
    return { status: 'unavailable' };
  }

  const registered = await registerToken(token, locale);
  stopTokenRefresh = onTokenRefresh(messaging, (nextToken) => {
    void registerToken(nextToken, locale).catch(() => undefined);
  });

  return { status: 'registered', tokenId: registered.tokenId };
}

export function stopNotificationTokenRefresh() {
  stopTokenRefresh?.();
  stopTokenRefresh = null;
}

async function registerToken(token: string, locale: NotificationRegistrationInput['locale']) {
  const callable = httpsCallable(getFunctions(getApp(), FUNCTIONS_REGION), 'registerDeviceToken');
  const response = await callable({
    enabled: true,
    locale,
    platform: Platform.OS,
    token,
  });

  return notificationRegistrationResultSchema.parse(response.data);
}
