export type NotificationRegistrationInput = {
  locale: 'ar' | 'en';
};

export type NotificationSetupResult =
  { status: 'registered'; tokenId: string } | { status: 'denied' | 'unavailable' };

export function registerForAppointmentNotifications(
  input: NotificationRegistrationInput,
): Promise<NotificationSetupResult>;

/**
 * Disables the signed-in account's push registration for this device before
 * sign-out. Never throws; when the server cannot be reached the disable is
 * recorded locally and retried once an account is signed in again.
 */
export function disableAppointmentNotifications(): Promise<void>;

/** Retries disables recorded by earlier sign-outs. Requires a signed-in account. */
export function flushPendingNotificationDeregistrations(): Promise<void>;

export function stopNotificationTokenRefresh(): void;

export function subscribeToAppointmentNotificationOpen(
  listener: (appointmentId: string) => void,
): () => void;
