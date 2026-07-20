import type { NotificationRegistrationInput, NotificationSetupResult } from './notifications';

export async function registerForAppointmentNotifications(
  _input: NotificationRegistrationInput,
): Promise<NotificationSetupResult> {
  return { status: 'unavailable' };
}

export function stopNotificationTokenRefresh() {}
