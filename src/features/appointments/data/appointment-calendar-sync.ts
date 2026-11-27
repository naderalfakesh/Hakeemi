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

  // Keep "moved" once the refetched visit catches up with the event.
  return next === 'added' && previous.status === 'moved'
    ? previous
    : { calendar: link.calendar, status: next };
}

export function resolveMissingCalendarLinkState(
  previous: AppointmentCalendarState,
): AppointmentCalendarState {
  // A finished follow-up already reported what happened to the event.
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
    // If this write fails the link keeps the old time, which only shows the
    // (idempotent) move button again; it never adds a second event.
    await storage
      .write(owner, appointmentId, { ...link, startsAt: time.startsAt })
      .catch(() => undefined);
    return { calendar: link.calendar, status: 'moved' };
  }

  if (result === null || result.status === 'denied') {
    // The event still exists; keeping the link lets the user retry the move
    // instead of adding a second event.
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
    // Keep the link so the user can retry once access is back.
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
  // One retry covers a busy storage queue; after that the user is told the
  // event will not follow the visit, rather than finding out later.
  const stored = await storage
    .write(owner, appointmentId, link)
    .catch(() => storage.write(owner, appointmentId, link))
    .then(
      () => true,
      () => false,
    );

  return { calendar, status: stored ? 'added' : 'addedUntracked' };
}
