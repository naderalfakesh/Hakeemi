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
 * Says whether a stored calendar event still matches the appointment: a
 * cancelled visit's event should go, a confirmed visit at another time needs
 * its event moved, and anything else matches. Callers act on it only after a
 * user's own reschedule or cancel, or a tap.
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
