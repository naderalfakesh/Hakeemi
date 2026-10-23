import { useCallback, useEffect, useMemo, useState } from 'react';

import {
  addAppointmentToCalendar,
  listWritableCalendars,
  moveAppointmentCalendarEvent,
  removeAppointmentCalendarEvent,
  type WritableCalendar,
} from '@/services/calendar/calendar';

import { calendarLinkStorage, type CalendarLinkStorage } from '../data/calendar-link-storage';
import { planCalendarFollowUp } from '../domain/calendar-link';
import type { Appointment } from '../domain/types';

export type AppointmentCalendarState =
  | { status: 'idle' | 'working' | 'denied' | 'unavailable' | 'error' }
  | { calendars: readonly WritableCalendar[]; status: 'choosing' }
  | { calendar: WritableCalendar; status: 'added' | 'moved' | 'removed' | 'notRemoved' }
  /** The visit moved but its old event could not follow; offer the new time. */
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
 * id is stored on the device; whenever the appointment shows up at another
 * time the event is moved, and when it is cancelled the event is deleted.
 * Without access or an event to change, the screen stops claiming the visit is
 * in the calendar and offers to add the new time instead.
 */
export function useAppointmentCalendar({
  appointment,
  providerName,
  storage = calendarLinkStorage,
}: {
  appointment: CalendarAppointment;
  providerName: string;
  storage?: CalendarLinkStorage;
}) {
  const [state, setState] = useState<AppointmentCalendarState>({ status: 'working' });
  const { endsAt, id, startsAt, status, timezone, visitMode } = appointment;
  const event = useMemo(
    () => ({ endsAt, providerName, startsAt, timezone, visitMode }),
    [endsAt, providerName, startsAt, timezone, visitMode],
  );

  useEffect(() => {
    let active = true;
    const update = (next: AppointmentCalendarState) => {
      if (active) {
        setState(next);
      }
    };

    async function followAppointment() {
      const link = await storage.read(id);

      if (!link) {
        update({ status: 'idle' });
        return;
      }

      const followUp = planCalendarFollowUp({ startsAt, status }, link);

      if (followUp === 'keep') {
        update({ calendar: link.calendar, status: 'added' });
        return;
      }

      update({ status: 'working' });

      if (followUp === 'remove') {
        const result = await removeAppointmentCalendarEvent({
          calendarId: link.calendar.id,
          eventId: link.eventId,
        }).catch(() => null);

        if (result?.status === 'denied' || result === null) {
          // Keep the link so a later visit with access can still clean up.
          update({ calendar: link.calendar, status: 'notRemoved' });
          return;
        }

        await storage.remove(id);
        update(
          result.status === 'done'
            ? { calendar: link.calendar, status: 'removed' }
            : { status: 'idle' },
        );
        return;
      }

      const result = await moveAppointmentCalendarEvent(
        { calendarId: link.calendar.id, eventId: link.eventId },
        {
          endsAt,
          startsAt,
          timezone,
        },
      ).catch(() => null);

      if (result?.status === 'done') {
        await storage.write(id, { ...link, startsAt });
        update({ calendar: link.calendar, status: 'moved' });
        return;
      }

      await storage.remove(id);
      update({ status: 'outdated' });
    }

    followAppointment().catch(() => update({ status: 'idle' }));

    return () => {
      active = false;
    };
  }, [endsAt, id, startsAt, status, storage, timezone]);

  const choose = useCallback(
    async (calendar: WritableCalendar) => {
      setState({ status: 'working' });

      try {
        const result = await addAppointmentToCalendar(calendar.id, event);

        if (result.status !== 'added') {
          setState(result);
          return;
        }

        await storage
          .write(id, { calendar, eventId: result.eventId, startsAt: event.startsAt })
          .catch(() => undefined);
        setState({ calendar, status: 'added' });
      } catch {
        setState({ status: 'error' });
      }
    },
    [event, id, storage],
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

  return { choose, dismissChooser, start, state };
}

export function formatCalendarName(calendar: WritableCalendar) {
  return calendar.accountName ? `${calendar.title} · ${calendar.accountName}` : calendar.title;
}
