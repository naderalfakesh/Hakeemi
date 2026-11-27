export const APPOINTMENT_REMINDER_CHANNEL_ID = 'appointment-reminders';

export const APPOINTMENT_REMINDER_CHANNEL = {
  description: 'Non-sensitive reminders about fictional Hakeemi appointments.',
  name: 'Appointment reminders',
  vibrationPattern: [0, 250, 250, 250],
} as const;

// Sign-out must stay usable on a poor connection: the whole wait for the
// server-side disable, including anything queued ahead of it, gets this
// budget. Slower work keeps running in the queue, and the sign-out is already
// recorded for a later retry before the wait starts.
export const NOTIFICATION_SIGN_OUT_BUDGET_MS = 5_000;

// Bounds each network or native call made from the queue so one slow call
// cannot stall the registrations behind it.
export const NOTIFICATION_DEREGISTRATION_TIMEOUT_MS = 5_000;

export const NOTIFICATION_DEREGISTRATION_TIMEOUT_MESSAGE = 'Notification deregistration timed out.';
