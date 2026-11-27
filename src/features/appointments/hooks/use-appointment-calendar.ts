import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import {
  listWritableCalendars,
  type CalendarEventTime,
  type WritableCalendar,
} from '@/services/calendar/calendar';

import {
  addAndLinkCalendarEvent,
  resolveMissingCalendarLinkState,
  resolveStoredCalendarState,
  syncCancelledCalendarEvent,
  syncRescheduledCalendarEvent,
} from '../data/appointment-calendar-sync';
import {
  calendarLinkStorage,
  type CalendarLinkOwner,
  type CalendarLinkStorage,
} from '../data/calendar-link-storage';
import type { AppointmentCalendarLink } from '../domain/calendar-link';
import type { AppointmentCalendarState } from '../domain/calendar-state';
import type { Appointment } from '../domain/types';

type CalendarAppointment = Pick<
  Appointment,
  'endsAt' | 'id' | 'startsAt' | 'status' | 'timezone' | 'visitMode'
>;

type UseAppointmentCalendarOptions = {
  appointment: CalendarAppointment | null;
  owner: CalendarLinkOwner | null;
  providerName: string;
  storage?: CalendarLinkStorage;
};

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
 * succeeds. A visit that changed any other way only offers a button to move or
 * remove the event.
 */
export function useAppointmentCalendar({
  appointment,
  owner,
  providerName,
  storage = calendarLinkStorage,
}: UseAppointmentCalendarOptions) {
  const [state, setState] = useState<AppointmentCalendarState>({ status: 'working' });
  // Bumped by every follow-up the user starts, so a link read that began
  // before it cannot overwrite its outcome.
  const generation = useRef(0);
  // Guards against a second add while the first is still being written.
  const adding = useRef(false);
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
    const startedAt = generation.current;
    const isCurrent = () => active && generation.current === startedAt;

    storage
      .read(owner, id)
      .then((link) => {
        if (!isCurrent()) {
          return;
        }

        setState((previous) =>
          link
            ? resolveStoredCalendarState({ startsAt, status }, link, previous)
            : resolveMissingCalendarLinkState(previous),
        );
      })
      .catch(() => {
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
      ) => Promise<AppointmentCalendarState>,
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
          setState(await change(link, owner, id));
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
      follow((link, linkedOwner, appointmentId) =>
        syncRescheduledCalendarEvent(storage, linkedOwner, appointmentId, link, time),
      ),
    [follow, storage],
  );

  const followCancel = useCallback(
    () =>
      follow((link, linkedOwner, appointmentId) =>
        syncCancelledCalendarEvent(storage, linkedOwner, appointmentId, link),
      ),
    [follow, storage],
  );

  const choose = useCallback(
    async (calendar: WritableCalendar) => {
      if (!owner || !id || adding.current) {
        return;
      }

      adding.current = true;
      setState({ status: 'working' });

      try {
        setState(await addAndLinkCalendarEvent(storage, owner, id, calendar, event));
      } catch {
        setState({ status: 'error' });
      } finally {
        adding.current = false;
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
