import { useCallback, useState } from 'react';

import {
  addAppointmentToCalendar,
  listWritableCalendars,
  type CalendarEventInput,
  type WritableCalendar,
} from '@/services/calendar/calendar';

export type AppointmentCalendarState =
  | { status: 'idle' | 'working' | 'denied' | 'unavailable' | 'error' }
  | { calendars: readonly WritableCalendar[]; status: 'choosing' }
  | { calendar: WritableCalendar; status: 'added' };

/**
 * Adds a visit to a calendar the user picks. Access is requested only when the
 * user asks, a single writable calendar is used directly, and several open a
 * chooser so the event never lands silently in an account the user did not
 * mean.
 */
export function useAppointmentCalendar(event: CalendarEventInput) {
  const [state, setState] = useState<AppointmentCalendarState>({ status: 'idle' });

  const addTo = useCallback(
    async (calendar: WritableCalendar) => {
      setState({ status: 'working' });

      try {
        const result = await addAppointmentToCalendar(calendar.id, event);

        setState(result.status === 'added' ? { calendar, status: 'added' } : result);
      } catch {
        setState({ status: 'error' });
      }
    },
    [event],
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
        await addTo(onlyCalendar);
        return;
      }

      setState({ calendars: result.calendars, status: 'choosing' });
    } catch {
      setState({ status: 'error' });
    }
  }, [addTo]);

  const dismissChooser = useCallback(() => setState({ status: 'idle' }), []);

  return { choose: addTo, dismissChooser, start, state };
}

export function formatCalendarName(calendar: WritableCalendar) {
  return calendar.accountName ? `${calendar.title} · ${calendar.accountName}` : calendar.title;
}
