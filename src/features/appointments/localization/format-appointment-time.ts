import type { Appointment } from '../domain/types';

// Explicit fields keep Arabic dates verbal ("26 يوليو") instead of numeric dateStyle: 'medium'.
export function formatAppointmentTime(
  appointment: Pick<Appointment, 'startsAt' | 'timezone'>,
  locale = 'en-AE',
  now: Date = new Date(),
) {
  const startsAt = new Date(appointment.startsAt);
  const year = (date: Date) =>
    new Intl.DateTimeFormat('en', { timeZone: appointment.timezone, year: 'numeric' }).format(date);

  return new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    month: 'short',
    timeZone: appointment.timezone,
    weekday: 'short',
    ...(year(startsAt) === year(now) ? {} : { year: 'numeric' as const }),
  }).format(startsAt);
}

export function formatAppointmentDateTime(
  appointment: Pick<Appointment, 'startsAt' | 'timezone'>,
  locale = 'en-AE',
) {
  return new Intl.DateTimeFormat(locale, {
    dateStyle: 'full',
    timeStyle: 'short',
    timeZone: appointment.timezone,
  }).format(new Date(appointment.startsAt));
}

export function formatAppointmentDate(value: string, locale = 'en-AE') {
  return new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(new Date(value));
}

const DAY_MS = 24 * 60 * 60 * 1000;

// Hermes lacks Intl.RelativeTimeFormat; callers localize the returned day count.
export function daysUntil(startsAt: string, now: Date = new Date()) {
  return Math.round((startOfDay(new Date(startsAt)) - startOfDay(now)) / DAY_MS);
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}
