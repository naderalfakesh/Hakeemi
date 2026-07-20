export type NotificationRegistrationInput = {
  locale: 'ar' | 'en';
};

export type NotificationSetupResult =
  { status: 'registered'; tokenId: string } | { status: 'denied' | 'unavailable' };

export function registerForAppointmentNotifications(
  input: NotificationRegistrationInput,
): Promise<NotificationSetupResult>;

export function stopNotificationTokenRefresh(): void;

export function subscribeToAppointmentNotificationOpen(
  listener: (appointmentId: string) => void,
): () => void;
