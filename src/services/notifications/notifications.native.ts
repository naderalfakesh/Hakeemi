import { getApp } from '@react-native-firebase/app';
import { getAuth } from '@react-native-firebase/auth';
import { getMessaging, getToken, onTokenRefresh } from '@react-native-firebase/messaging';

import { hasInternetConnection } from '@/services/connectivity/connectivity';
import { createSerialQueue, withTimeout } from '@/utils/async';

import {
  NOTIFICATION_DEREGISTRATION_TIMEOUT_MESSAGE,
  NOTIFICATION_SIGN_OUT_BUDGET_MS,
} from './constants';
import {
  deriveDeviceTokenId,
  ensureNotificationPermission,
  readDeviceToken,
  registerDeviceToken,
  unregisterDeviceToken,
} from './device-token-api.native';
import type { NotificationRegistrationInput, NotificationSetupResult } from './notifications';
import {
  addPendingDeregistration,
  readPendingDeregistrations,
  removePendingDeregistration,
} from './pending-deregistrations';

export { subscribeToAppointmentNotificationOpen } from './notification-open.native';

let stopTokenRefresh: (() => void) | null = null;
const enqueue = createSerialQueue();
// Incremented on sign-out so in-flight registrations for the previous account bail out.
let sessionEpoch = 0;

export async function registerForAppointmentNotifications({
  locale,
}: NotificationRegistrationInput): Promise<NotificationSetupResult> {
  stopNotificationTokenRefresh();
  const epoch = sessionEpoch;

  if (!(await ensureNotificationPermission())) {
    return { status: 'denied' };
  }

  const messaging = getMessaging(getApp());
  const token = await getToken(messaging);

  if (!token) {
    return { status: 'unavailable' };
  }

  const registered = await enqueue(async () => {
    if (epoch !== sessionEpoch) {
      return null;
    }

    await flushPendingDeregistrations(token).catch(() => undefined);
    return registerDeviceToken(token, locale);
  });

  if (!registered) {
    return { status: 'unavailable' };
  }

  if (epoch === sessionEpoch) {
    stopNotificationTokenRefresh();
    stopTokenRefresh = onTokenRefresh(messaging, (nextToken) => {
      void enqueue(async () => {
        if (epoch === sessionEpoch) {
          await registerDeviceToken(nextToken, locale);
        }
      }).catch(() => undefined);
    });
  }

  return { status: 'registered', tokenId: registered.tokenId };
}

export async function disableAppointmentNotifications(): Promise<void> {
  stopNotificationTokenRefresh();
  sessionEpoch += 1;
  // Capture before queuing so a subsequent sign-in never redirects this disable.
  const userId = getAuth(getApp()).currentUser?.uid;

  if (!userId) {
    return;
  }

  await addPendingDeregistration({ tokenId: null, userId }).catch(() => undefined);
  await withTimeout(
    enqueue(() => disableAccountRegistration(userId)),
    NOTIFICATION_SIGN_OUT_BUDGET_MS,
    NOTIFICATION_DEREGISTRATION_TIMEOUT_MESSAGE,
  ).catch(() => undefined);
}

export async function flushPendingNotificationDeregistrations(): Promise<void> {
  await enqueue(() => flushPendingDeregistrations(null)).catch(() => undefined);
}

export function stopNotificationTokenRefresh() {
  stopTokenRefresh?.();
  stopTokenRefresh = null;
}

async function disableAccountRegistration(userId: string) {
  const token = await readDeviceToken();
  const tokenId = token ? await deriveDeviceTokenId(token) : null;

  await recordSignOut(userId, tokenId).catch(() => undefined);

  if (!token || !(await hasInternetConnection()) || !getAuth(getApp()).currentUser) {
    return;
  }

  await unregisterDeviceToken(token, userId);
  await removePendingDeregistration({ tokenId, userId }).catch(() => undefined);
  await removePendingDeregistration({ tokenId: null, userId }).catch(() => undefined);
  await flushPendingDeregistrations(token).catch(() => undefined);
}

async function recordSignOut(userId: string, tokenId: string | null) {
  if (tokenId === null) {
    await addPendingDeregistration({ tokenId: null, userId });
    return;
  }

  await addPendingDeregistration({ tokenId, userId });
  await removePendingDeregistration({ tokenId: null, userId });
}

async function flushPendingDeregistrations(knownToken: string | null) {
  if (!getAuth(getApp()).currentUser) {
    return;
  }

  const entries = await readPendingDeregistrations();

  if (entries.length === 0) {
    return;
  }

  const token = knownToken ?? (await readDeviceToken());

  if (!token) {
    return;
  }

  const currentTokenId = await deriveDeviceTokenId(token);

  for (const entry of entries) {
    // Rotated tokens cannot be proven by possession; FCM disables them on next delivery.
    if (entry.tokenId !== null && entry.tokenId !== currentTokenId) {
      await removePendingDeregistration(entry);
      continue;
    }

    await unregisterDeviceToken(token, entry.userId);
    await removePendingDeregistration(entry);
  }
}
