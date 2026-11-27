export const APPOINTMENT_REMINDER_CHANNEL_ID = 'appointment-reminders';

export const APPOINTMENT_REMINDER_CHANNEL = {
  description: 'Non-sensitive reminders about fictional Hakeemi appointments.',
  name: 'Appointment reminders',
  vibrationPattern: [0, 250, 250, 250],
} as const;

export const NOTIFICATION_SIGN_OUT_BUDGET_MS = 5_000;
export const NOTIFICATION_DEREGISTRATION_TIMEOUT_MS = 5_000;

export const NOTIFICATION_DEREGISTRATION_TIMEOUT_MESSAGE = 'Notification deregistration timed out.';
