import type { WritableCalendar } from '@/services/calendar/calendar';

import type { Appointment } from './types';

/** The device calendar event created for an appointment, as last written. */
export type AppointmentCalendarLink = {
  calendar: WritableCalendar;
  eventId: string;
  /** The appointment start the event was last written with. */
  startsAt: string;
};

export type CalendarFollowUp = 'keep' | 'move' | 'remove';

/**
 * Decides how a stored calendar event has to follow the appointment: a
 * cancelled visit takes its event out, a confirmed visit at a new time moves
 * it, and anything else leaves the event alone.
 */
export function planCalendarFollowUp(
  appointment: Pick<Appointment, 'startsAt' | 'status'>,
  link: Pick<AppointmentCalendarLink, 'startsAt'>,
): CalendarFollowUp {
  if (appointment.status === 'cancelled') {
    return 'remove';
  }

  if (
    appointment.status === 'confirmed' &&
    new Date(appointment.startsAt).getTime() !== new Date(link.startsAt).getTime()
  ) {
    return 'move';
  }

  return 'keep';
}
