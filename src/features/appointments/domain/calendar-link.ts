import type { WritableCalendar } from '@/services/calendar/calendar';

import type { Appointment } from './types';

export type AppointmentCalendarLink = {
  calendar: WritableCalendar;
  eventId: string;
  startsAt: string;
};

export type CalendarFollowUp = 'keep' | 'move' | 'remove';

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
