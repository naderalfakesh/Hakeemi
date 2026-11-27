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
// Registration changes run one at a time so a late registration (enable or
// token refresh) can never land after the sign-out that had to disable it, and
// a pending flush always precedes the registration that follows it.
const enqueue = createSerialQueue();
// Sign-out advances the epoch; registration work started for the previous
// account checks it and drops out instead of re-enabling that account.
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

/**
 * Disables this device's push registration for the signed-in account. Must run
 * before Firebase sign-out because the callable needs the account's
 * credentials. Never throws and never waits longer than the sign-out budget,
 * even when a registration is still in flight ahead of it: the sign-out is
 * recorded locally first and retried the next time an account is signed in on
 * this device.
 */
export async function disableAppointmentNotifications(): Promise<void> {
  stopNotificationTokenRefresh();
  sessionEpoch += 1;
  // Fixed now, before anything can block: the queued disable must act on the
  // account that signed out, never on whoever is signed in by the time it runs.
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

  // Storage is best effort from here on: the sign-out must still reach the
  // server when the device can, even if the retry record cannot be written.
  await recordSignOut(userId, tokenId).catch(() => undefined);

  if (!token || !(await hasInternetConnection()) || !getAuth(getApp()).currentUser) {
    // No raw token to present, offline, or nobody signed in to authenticate:
    // the recorded entry is retried on the next signed-in opportunity.
    return;
  }

  // Runs under whichever account is signed in when the queue reaches it.
  // Sent directly rather than through stored entries so a failing store cannot skip it.
  await unregisterDeviceToken(token, userId);
  await removePendingDeregistration({ tokenId, userId }).catch(() => undefined);
  await removePendingDeregistration({ tokenId: null, userId }).catch(() => undefined);
  await flushPendingDeregistrations(token).catch(() => undefined);
}

async function recordSignOut(userId: string, tokenId: string | null) {
  if (tokenId === null) {
    // Put the placeholder back in case a concurrent registration removed it.
    await addPendingDeregistration({ tokenId: null, userId });
    return;
  }

  // Narrow the placeholder to the token the device held so a later rotation is detected.
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
    if (entry.tokenId !== null && entry.tokenId !== currentTokenId) {
      // The device token rotated after that sign-out; FCM rejects the old token
      // and the reminder job disables that record on its first delivery attempt.
      await removePendingDeregistration(entry);
      continue;
    }

    // A failure stops the flush and keeps remaining entries for the next retry.
    await unregisterDeviceToken(token, entry.userId);
    await removePendingDeregistration(entry);
  }
}
