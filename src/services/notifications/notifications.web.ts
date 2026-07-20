import type { NotificationRegistrationInput, NotificationSetupResult } from './notifications';

export async function registerForAppointmentNotifications(
  _input: NotificationRegistrationInput,
): Promise<NotificationSetupResult> {
  return { status: 'unavailable' };
}

export function stopNotificationTokenRefresh() {}

export function subscribeToAppointmentNotificationOpen(_listener: (appointmentId: string) => void) {
  return () => undefined;
}
