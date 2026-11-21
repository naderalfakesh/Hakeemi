import type { Appointment } from '../domain/types';

/**
 * The visit's date and time in the clinic's own time zone, in the short form
 * lists and cards share with clinician availability ("Sat, 21 Nov at
 * 9:30 AM"). The year only appears when it is not the current one.
 *
 * Explicit fields keep Arabic dates verbose ("26 يوليو") instead of the
 * numeric "2026/07/26" that dateStyle: 'medium' produces for ar-AE.
 */
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

/**
 * The visit's full date and time in the clinic's own time zone, for the
 * screens that show a single appointment.
 */
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

/** A calendar date without a time, such as the day a visit was cancelled. */
export function formatAppointmentDate(value: string, locale = 'en-AE') {
  return new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(new Date(value));
}

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Calendar days from today to the visit, counted on the device, so a visit at
 * 9:00 tomorrow is one day away even late tonight. Hermes has no
 * Intl.RelativeTimeFormat, so the wording lives in the localized strings.
 */
export function daysUntil(startsAt: string, now: Date = new Date()) {
  return Math.round((startOfDay(new Date(startsAt)) - startOfDay(now)) / DAY_MS);
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}
