import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import {
  addAppointmentToCalendar,
  listWritableCalendars,
  moveAppointmentCalendarEvent,
  removeAppointmentCalendarEvent,
  type CalendarEventTime,
  type WritableCalendar,
} from '@/services/calendar/calendar';

import {
  calendarLinkStorage,
  type CalendarLinkOwner,
  type CalendarLinkStorage,
} from '../data/calendar-link-storage';
import { planCalendarFollowUp, type AppointmentCalendarLink } from '../domain/calendar-link';
import type { Appointment } from '../domain/types';

export type AppointmentCalendarState =
  | { status: 'idle' | 'working' | 'denied' | 'unavailable' | 'error' }
  | { calendars: readonly WritableCalendar[]; status: 'choosing' }
  | {
      calendar: WritableCalendar;
      /**
       * added: the event matches the visit. moved: it just followed a
       * reschedule. stale: it still has an earlier time, and only the user's
       * tap moves it. removed: it followed a cancellation. notRemoved: the
       * visit is cancelled but the event is still there.
       */
      status: 'added' | 'moved' | 'stale' | 'removed' | 'notRemoved';
    }
  /** The visit moved but its event is gone; offer to add the new time. */
  | { status: 'outdated' };

type CalendarAppointment = Pick<
  Appointment,
  'endsAt' | 'id' | 'startsAt' | 'status' | 'timezone' | 'visitMode'
>;

/**
 * Keeps a visit and its device calendar event together.
 *
 * Adding asks for access only when the user taps, uses a single writable
 * calendar directly, and opens a chooser when there are several, so the event
 * never lands silently in an account the user did not mean. The created event
 * id is stored on the device for the signed-in account or demo session.
 *
 * The event only changes because of something the user did: the screen calls
 * `followReschedule` or `followCancel` after its own reschedule or cancel
 * succeeds. A visit that changed any other way (the demo catalogue rolling
 * forward, another device) only offers a button to move or remove the event.
 */
export function useAppointmentCalendar({
  appointment,
  owner,
  providerName,
  storage = calendarLinkStorage,
}: {
  appointment: CalendarAppointment | null;
  owner: CalendarLinkOwner | null;
  providerName: string;
  storage?: CalendarLinkStorage;
}) {
  const [state, setState] = useState<AppointmentCalendarState>({ status: 'working' });
  // Bumped by every follow-up the user starts, so a link read that began
  // before it cannot overwrite its outcome.
  const generation = useRef(0);
  const id = appointment?.id ?? null;
  const endsAt = appointment?.endsAt ?? '';
  const startsAt = appointment?.startsAt ?? '';
  const status = appointment?.status ?? null;
  const timezone = appointment?.timezone ?? '';
  const visitMode = appointment?.visitMode ?? 'in_person';
  const event = useMemo(
    () => ({ endsAt, providerName, startsAt, timezone, visitMode }),
    [endsAt, providerName, startsAt, timezone, visitMode],
  );

  useEffect(() => {
    if (!owner || !id || !status) {
      return;
    }

    let active = true;
    const linkedOwner = owner;
    const appointmentId = id;
    const appointmentStatus = status;

    const startedAt = generation.current;
    const isCurrent = () => active && generation.current === startedAt;

    async function describeLink() {
      const link = await storage.read(linkedOwner, appointmentId);

      if (!isCurrent()) {
        return;
      }

      if (!link) {
        // A finished follow-up already said what happened to the event.
        setState((previous) =>
          previous.status === 'removed' || previous.status === 'outdated'
            ? previous
            : { status: 'idle' },
        );
        return;
      }

      const followUp = planCalendarFollowUp({ startsAt, status: appointmentStatus }, link);
      const next =
        followUp === 'keep' ? 'added' : followUp === 'move' ? 'stale' : ('notRemoved' as const);

      setState((previous) =>
        // Keep "moved" once the refetched visit catches up with the event.
        next === 'added' && previous.status === 'moved'
          ? previous
          : { calendar: link.calendar, status: next },
      );
    }

    describeLink().catch(() => {
      if (isCurrent()) {
        setState({ status: 'idle' });
      }
    });

    return () => {
      active = false;
    };
  }, [id, owner, startsAt, status, storage]);

  const follow = useCallback(
    async (
      change: (
        link: AppointmentCalendarLink,
        linkedOwner: CalendarLinkOwner,
        appointmentId: string,
      ) => Promise<void>,
    ) => {
      if (!owner || !id) {
        return;
      }

      generation.current += 1;
      const startedAt = generation.current;

      try {
        const link = await storage.read(owner, id);

        if (link) {
          setState({ status: 'working' });
          await change(link, owner, id);
        }
      } catch {
        if (generation.current === startedAt) {
          setState({ status: 'error' });
        }
      }
    },
    [id, owner, storage],
  );

  const followReschedule = useCallback(
    (time: CalendarEventTime) =>
      follow(async (link, linkedOwner, appointmentId) => {
        const result = await moveAppointmentCalendarEvent(
          { calendarId: link.calendar.id, eventId: link.eventId },
          time,
        ).catch(() => null);

        if (result?.status === 'done') {
          await storage.write(linkedOwner, appointmentId, {
            ...link,
            startsAt: time.startsAt,
          });
          setState({ calendar: link.calendar, status: 'moved' });
          return;
        }

        if (result === null || result.status === 'denied') {
          // The event still exists; keeping the link lets the user retry the
          // move instead of adding a second event.
          setState({ calendar: link.calendar, status: 'stale' });
          return;
        }

        await storage.remove(linkedOwner, appointmentId);
        setState({ status: 'outdated' });
      }),
    [follow, storage],
  );

  const followCancel = useCallback(
    () =>
      follow(async (link, linkedOwner, appointmentId) => {
        const result = await removeAppointmentCalendarEvent({
          calendarId: link.calendar.id,
          eventId: link.eventId,
        }).catch(() => null);

        if (result === null || result.status === 'denied') {
          // Keep the link so the user can retry once access is back.
          setState({ calendar: link.calendar, status: 'notRemoved' });
          return;
        }

        await storage.remove(linkedOwner, appointmentId);
        setState(
          result.status === 'done'
            ? { calendar: link.calendar, status: 'removed' }
            : { status: 'idle' },
        );
      }),
    [follow, storage],
  );

  const choose = useCallback(
    async (calendar: WritableCalendar) => {
      if (!owner || !id) {
        return;
      }

      setState({ status: 'working' });

      try {
        const result = await addAppointmentToCalendar(calendar.id, event);

        if (result.status !== 'added') {
          setState(result);
          return;
        }

        await storage
          .write(owner, id, { calendar, eventId: result.eventId, startsAt: event.startsAt })
          .catch(() => undefined);
        setState({ calendar, status: 'added' });
      } catch {
        setState({ status: 'error' });
      }
    },
    [event, id, owner, storage],
  );

  const start = useCallback(async () => {
    setState({ status: 'working' });

    try {
      const result = await listWritableCalendars();

      if (result.status !== 'ready') {
        setState(result);
        return;
      }

      const [onlyCalendar] = result.calendars;

      if (result.calendars.length === 1 && onlyCalendar) {
        await choose(onlyCalendar);
        return;
      }

      setState({ calendars: result.calendars, status: 'choosing' });
    } catch {
      setState({ status: 'error' });
    }
  }, [choose]);

  const dismissChooser = useCallback(() => setState({ status: 'idle' }), []);
  const moveToCurrentTime = useCallback(
    () => followReschedule({ endsAt, startsAt, timezone }),
    [endsAt, followReschedule, startsAt, timezone],
  );

  return {
    choose,
    dismissChooser,
    followCancel,
    followReschedule,
    moveToCurrentTime,
    removeEvent: followCancel,
    start,
    state,
  };
}

export type AppointmentCalendar = ReturnType<typeof useAppointmentCalendar>;

export function formatCalendarName(calendar: WritableCalendar) {
  return calendar.accountName ? `${calendar.title} · ${calendar.accountName}` : calendar.title;
}
