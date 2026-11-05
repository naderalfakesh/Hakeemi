import type { Appointment } from '../domain/types';

/**
 * The visit's date and time in the clinic's own time zone.
 *
 * Explicit fields keep Arabic dates verbose ("26 يوليو 2026") instead of the
 * numeric "2026/07/26" that dateStyle: 'medium' produces for ar-AE.
 */
export function formatAppointmentTime(
  appointment: Pick<Appointment, 'startsAt' | 'timezone'>,
  locale = 'en-AE',
) {
  return new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    month: 'short',
    timeZone: appointment.timezone,
    year: 'numeric',
  }).format(new Date(appointment.startsAt));
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
