import { getApp } from '@react-native-firebase/app';
import { getAuth } from '@react-native-firebase/auth';
import {
  getInitialNotification,
  getMessaging,
  getToken,
  onNotificationOpenedApp,
  onTokenRefresh,
} from '@react-native-firebase/messaging';
import { getFunctions, httpsCallable } from '@react-native-firebase/functions';
import * as Crypto from 'expo-crypto';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import {
  notificationDeregistrationResultSchema,
  notificationRegistrationResultSchema,
  parseAppointmentNotification,
} from '@/features/notifications/domain/schemas';
import { hasInternetConnection } from '@/services/connectivity/connectivity';

import type { NotificationRegistrationInput, NotificationSetupResult } from './notifications';
import {
  addPendingDeregistration,
  readPendingDeregistrations,
  removePendingDeregistration,
  removePendingDeregistrationsSupersededBy,
} from './pending-deregistrations';

const FUNCTIONS_REGION = 'me-central1';
const APPOINTMENT_REMINDER_CHANNEL = 'appointment-reminders';
// Sign-out must stay usable on a poor connection: the whole wait for the
// server-side disable, including anything queued ahead of it, gets this
// budget. Slower work keeps running in the queue, and the sign-out is already
// recorded for a later retry before the wait starts.
const SIGN_OUT_BUDGET_MS = 5_000;
// Bounds each network or native call made from the queue so one slow call
// cannot stall the registrations behind it.
const DEREGISTRATION_TIMEOUT_MS = 5_000;

let stopTokenRefresh: (() => void) | null = null;
// Registration changes run one at a time so a late registration (enable or
// token refresh) can never land after the sign-out that had to disable it, and
// a pending flush always precedes the registration that follows it.
let operationQueue: Promise<unknown> = Promise.resolve();
// Sign-out advances the epoch; registration work started for the previous
// account checks it and drops out instead of re-enabling that account.
let sessionEpoch = 0;

export async function registerForAppointmentNotifications({
  locale,
}: NotificationRegistrationInput): Promise<NotificationSetupResult> {
  stopNotificationTokenRefresh();
  const epoch = sessionEpoch;

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

  const registered = await enqueue(async () => {
    if (epoch !== sessionEpoch) {
      return null;
    }

    await flushPendingDeregistrations(token).catch(() => undefined);
    return registerToken(token, locale);
  });

  if (!registered) {
    return { status: 'unavailable' };
  }

  if (epoch === sessionEpoch) {
    stopNotificationTokenRefresh();
    stopTokenRefresh = onTokenRefresh(messaging, (nextToken) => {
      void enqueue(async () => {
        if (epoch === sessionEpoch) {
          await registerToken(nextToken, locale);
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
 * this device. Until that retry (or until another account registers the same
 * token) the server still holds the registration, so an offline or
 * timed-out sign-out is not an immediate remote disable.
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
    SIGN_OUT_BUDGET_MS,
  ).catch(() => undefined);
}

export async function flushPendingNotificationDeregistrations(): Promise<void> {
  await enqueue(() => flushPendingDeregistrations(null)).catch(() => undefined);
}

export function stopNotificationTokenRefresh() {
  stopTokenRefresh?.();
  stopTokenRefresh = null;
}

export function subscribeToAppointmentNotificationOpen(listener: (appointmentId: string) => void) {
  const messaging = getMessaging(getApp());
  let active = true;
  const unsubscribe = onNotificationOpenedApp(messaging, (message) => {
    const appointmentId = parseAppointmentNotification(message.data);

    if (active && appointmentId) {
      listener(appointmentId);
    }
  });

  void getInitialNotification(messaging).then((message) => {
    const appointmentId = parseAppointmentNotification(message?.data);

    if (active && appointmentId) {
      listener(appointmentId);
    }
  });

  return () => {
    active = false;
    unsubscribe();
  };
}

async function disableAccountRegistration(userId: string) {
  const token = await readDeviceToken();
  const tokenId = token ? await deriveTokenId(token) : null;

  // Storage is best effort from here on: the sign-out must still reach the
  // server when the device can, even if the retry record cannot be written.
  await recordSignOut(userId, tokenId).catch(() => undefined);

  if (!token || !(await hasInternetConnection()) || !getAuth(getApp()).currentUser) {
    // No raw token to present, offline, or nobody signed in to authenticate:
    // the recorded entry is retried on the next signed-in opportunity.
    return;
  }

  // Runs under whichever account is signed in when the queue reaches it: the
  // same account if the sign-out is still waiting, or the next account, which
  // may disable the signed-out account's record by possession of the token.
  // The request names the account that signed out, so the next account's own
  // registration is never touched. Sent directly rather than through the
  // stored entries so a failing store cannot skip it.
  await unregisterToken(token, userId);
  await removePendingDeregistration({ tokenId, userId }).catch(() => undefined);
  await removePendingDeregistration({ tokenId: null, userId }).catch(() => undefined);
  await flushPendingDeregistrations(token).catch(() => undefined);
}

async function recordSignOut(userId: string, tokenId: string | null) {
  if (tokenId === null) {
    // The token could not be read, so the placeholder written at sign-out is
    // put back: a registration that completed meanwhile may have removed it
    // as superseded, and without it the sign-out would never be retried.
    await addPendingDeregistration({ tokenId: null, userId });
    return;
  }

  // Narrow the placeholder to the token the device held, so a later rotation
  // is detected. Written again here because a registration that completed
  // meanwhile may have superseded the placeholder.
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

  const currentTokenId = await deriveTokenId(token);

  for (const entry of entries) {
    if (entry.tokenId !== null && entry.tokenId !== currentTokenId) {
      // The device token rotated after that sign-out, so the old record can no
      // longer be proven by possession. FCM rejects the rotated-out token and
      // the reminder job disables that record on its first delivery attempt.
      await removePendingDeregistration(entry);
      continue;
    }

    // A failure stops the flush and keeps the remaining entries for the next retry.
    await unregisterToken(token, entry.userId);
    await removePendingDeregistration(entry);
  }
}

async function registerToken(token: string, locale: NotificationRegistrationInput['locale']) {
  const userId = getAuth(getApp()).currentUser?.uid;
  const callable = httpsCallable(getFunctions(getApp(), FUNCTIONS_REGION), 'registerDeviceToken');
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

async function unregisterToken(token: string, userId: string) {
  const callable = httpsCallable(getFunctions(getApp(), FUNCTIONS_REGION), 'unregisterDeviceToken');
  const response = await withTimeout(callable({ token, userId }), DEREGISTRATION_TIMEOUT_MS);

  return notificationDeregistrationResultSchema.parse(response.data);
}

async function readDeviceToken() {
  try {
    return (await withTimeout(getToken(getMessaging(getApp())), DEREGISTRATION_TIMEOUT_MS)) || null;
  } catch {
    return null;
  }
}

function deriveTokenId(token: string) {
  return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, token);
}

function enqueue<T>(operation: () => Promise<T>): Promise<T> {
  const run = operationQueue.then(operation, operation);
  operationQueue = run.catch(() => undefined);

  return run;
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(
      () => reject(new Error('Notification deregistration timed out.')),
      timeoutMs,
    );
  });

  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}
