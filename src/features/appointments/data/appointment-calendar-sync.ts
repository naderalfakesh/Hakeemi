import {
  addAppointmentToCalendar,
  moveAppointmentCalendarEvent,
  removeAppointmentCalendarEvent,
  type CalendarEventInput,
  type CalendarEventTime,
  type WritableCalendar,
} from '@/services/calendar/calendar';

import type { CalendarLinkOwner, CalendarLinkStorage } from './calendar-link-storage';
import { planCalendarFollowUp, type AppointmentCalendarLink } from '../domain/calendar-link';
import type { AppointmentCalendarState } from '../domain/calendar-state';
import type { AppointmentStatus } from '../domain/types';

export function resolveStoredCalendarState(
  appointment: { startsAt: string; status: AppointmentStatus },
  link: AppointmentCalendarLink,
  previous: AppointmentCalendarState,
): AppointmentCalendarState {
  const followUp = planCalendarFollowUp(appointment, link);
  const next =
    followUp === 'keep' ? 'added' : followUp === 'move' ? 'stale' : ('notRemoved' as const);

  return next === 'added' && previous.status === 'moved'
    ? previous
    : { calendar: link.calendar, status: next };
}

export function resolveMissingCalendarLinkState(
  previous: AppointmentCalendarState,
): AppointmentCalendarState {
  return previous.status === 'removed' || previous.status === 'outdated'
    ? previous
    : { status: 'idle' };
}

export async function syncRescheduledCalendarEvent(
  storage: CalendarLinkStorage,
  owner: CalendarLinkOwner,
  appointmentId: string,
  link: AppointmentCalendarLink,
  time: CalendarEventTime,
): Promise<AppointmentCalendarState> {
  const result = await moveAppointmentCalendarEvent(
    { calendarId: link.calendar.id, eventId: link.eventId },
    time,
  ).catch(() => null);

  if (result?.status === 'done') {
    await storage
      .write(owner, appointmentId, { ...link, startsAt: time.startsAt })
      .catch(() => undefined);
    return { calendar: link.calendar, status: 'moved' };
  }

  if (result === null || result.status === 'denied') {
    return { calendar: link.calendar, status: 'stale' };
  }

  await storage.remove(owner, appointmentId);
  return { status: 'outdated' };
}

export async function syncCancelledCalendarEvent(
  storage: CalendarLinkStorage,
  owner: CalendarLinkOwner,
  appointmentId: string,
  link: AppointmentCalendarLink,
): Promise<AppointmentCalendarState> {
  const result = await removeAppointmentCalendarEvent({
    calendarId: link.calendar.id,
    eventId: link.eventId,
  }).catch(() => null);

  if (result === null || result.status === 'denied') {
    return { calendar: link.calendar, status: 'notRemoved' };
  }

  await storage.remove(owner, appointmentId);
  return result.status === 'done'
    ? { calendar: link.calendar, status: 'removed' }
    : { status: 'idle' };
}

export async function addAndLinkCalendarEvent(
  storage: CalendarLinkStorage,
  owner: CalendarLinkOwner,
  appointmentId: string,
  calendar: WritableCalendar,
  event: CalendarEventInput,
): Promise<AppointmentCalendarState> {
  const result = await addAppointmentToCalendar(calendar.id, event);

  if (result.status !== 'added') {
    return result;
  }

  const link: AppointmentCalendarLink = {
    calendar,
    eventId: result.eventId,
    startsAt: event.startsAt,
  };
  const stored = await storage
    .write(owner, appointmentId, link)
    .catch(() => storage.write(owner, appointmentId, link))
    .then(
      () => true,
      () => false,
    );

  return { calendar, status: stored ? 'added' : 'addedUntracked' };
}
