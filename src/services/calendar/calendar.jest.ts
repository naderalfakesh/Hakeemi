import type {
  CalendarEventChangeResult,
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
  _eventId: string,
  _time: CalendarEventTime,
): Promise<CalendarEventChangeResult> {
  return { status: 'missing' };
}

export async function removeAppointmentCalendarEvent(
  _eventId: string,
): Promise<CalendarEventChangeResult> {
  return { status: 'missing' };
}
