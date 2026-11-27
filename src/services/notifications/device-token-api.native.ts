import { getApp } from '@react-native-firebase/app';
import { getAuth } from '@react-native-firebase/auth';
import { getFunctions, httpsCallable } from '@react-native-firebase/functions';
import { getMessaging, getToken } from '@react-native-firebase/messaging';
import * as Crypto from 'expo-crypto';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import {
  notificationDeregistrationResultSchema,
  notificationRegistrationResultSchema,
} from '@/features/notifications/domain/schemas';
import { FIREBASE_FUNCTIONS_REGION } from '@/services/firebase/constants';
import { withTimeout } from '@/utils/async';

import {
  APPOINTMENT_REMINDER_CHANNEL,
  APPOINTMENT_REMINDER_CHANNEL_ID,
  NOTIFICATION_DEREGISTRATION_TIMEOUT_MESSAGE,
  NOTIFICATION_DEREGISTRATION_TIMEOUT_MS,
} from './constants';
import type { NotificationRegistrationInput } from './notifications';
import { removePendingDeregistrationsSupersededBy } from './pending-deregistrations';

export async function ensureNotificationPermission(): Promise<boolean> {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(APPOINTMENT_REMINDER_CHANNEL_ID, {
      description: APPOINTMENT_REMINDER_CHANNEL.description,
      // eslint-plugin-import cannot detect expo-notifications' compiled enum
      // exports as an ES module; TypeScript still checks this member.
      // eslint-disable-next-line import/namespace
      importance: Notifications.AndroidImportance.DEFAULT,
      name: APPOINTMENT_REMINDER_CHANNEL.name,
      vibrationPattern: [...APPOINTMENT_REMINDER_CHANNEL.vibrationPattern],
    });
  }

  const currentPermission = await Notifications.getPermissionsAsync();
  const permission = currentPermission.granted
    ? currentPermission
    : await Notifications.requestPermissionsAsync();

  return permission.granted;
}

export async function registerDeviceToken(
  token: string,
  locale: NotificationRegistrationInput['locale'],
) {
  const userId = getAuth(getApp()).currentUser?.uid;
  const callable = httpsCallable(
    getFunctions(getApp(), FIREBASE_FUNCTIONS_REGION),
    'registerDeviceToken',
  );
  const response = await callable({
    enabled: true,
    locale,
    platform: Platform.OS,
    token,
  });
  const result = notificationRegistrationResultSchema.parse(response.data);

  if (userId) {
    await removePendingDeregistrationsSupersededBy(userId, result.tokenId).catch(() => undefined);
  }

  return result;
}

export async function unregisterDeviceToken(token: string, userId: string) {
  const callable = httpsCallable(
    getFunctions(getApp(), FIREBASE_FUNCTIONS_REGION),
    'unregisterDeviceToken',
  );
  const response = await withTimeout(
    callable({ token, userId }),
    NOTIFICATION_DEREGISTRATION_TIMEOUT_MS,
    NOTIFICATION_DEREGISTRATION_TIMEOUT_MESSAGE,
  );

  return notificationDeregistrationResultSchema.parse(response.data);
}

export async function readDeviceToken(): Promise<string | null> {
  try {
    return (
      (await withTimeout(
        getToken(getMessaging(getApp())),
        NOTIFICATION_DEREGISTRATION_TIMEOUT_MS,
        NOTIFICATION_DEREGISTRATION_TIMEOUT_MESSAGE,
      )) || null
    );
  } catch {
    return null;
  }
}

export function deriveDeviceTokenId(token: string): Promise<string> {
  return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, token);
}
