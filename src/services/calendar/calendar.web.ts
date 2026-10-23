import type {
  CalendarEventChangeResult,
  CalendarEventRef,
  CalendarEventInput,
  CalendarEventTime,
  CalendarListResult,
  CalendarSaveResult,
} from './calendar';

export async function listWritableCalendars(): Promise<CalendarListResult> {
  return { status: 'unavailable' };
}

export async function addAppointmentToCalendar(
  _calendarId: string,
  _input: CalendarEventInput,
): Promise<CalendarSaveResult> {
  return { status: 'unavailable' };
}

export async function moveAppointmentCalendarEvent(
  _ref: CalendarEventRef,
  _time: CalendarEventTime,
): Promise<CalendarEventChangeResult> {
  return { status: 'missing' };
}

export async function removeAppointmentCalendarEvent(
  _ref: CalendarEventRef,
): Promise<CalendarEventChangeResult> {
  return { status: 'missing' };
}
