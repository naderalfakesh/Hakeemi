import { type MulticastMessage } from 'firebase-admin/messaging';

export type ReminderLocale = 'ar' | 'en';

const REMINDER_COPY: Record<ReminderLocale, { body: string; title: string }> = {
  ar: {
    body: 'لديك موعد قادم في «حكيمي».',
    title: 'تذكير بالموعد',
  },
  en: {
    body: 'You have a Hakeemi appointment coming up.',
    title: 'Appointment reminder',
  },
};

export function resolveReminderLocale(locale: unknown): ReminderLocale {
  return typeof locale === 'string' && /^ar(?![a-z])/i.test(locale.trim()) ? 'ar' : 'en';
}

export function buildAppointmentReminderMessage(
  tokens: readonly string[],
  appointmentId: string,
  locale: ReminderLocale = 'en',
): MulticastMessage {
  return {
    android: {
      notification: {
        channelId: 'appointment-reminders',
      },
    },
    apns: {
      payload: {
        aps: {
          sound: 'default',
        },
      },
    },
    data: {
      appointmentId,
      type: 'appointment_reminder',
    },
    notification: { ...REMINDER_COPY[locale] },
    tokens: [...tokens],
  };
}
