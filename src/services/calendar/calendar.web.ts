import type { CalendarEventInput, CalendarListResult, CalendarSaveResult } from './calendar';

export async function listWritableCalendars(): Promise<CalendarListResult> {
  return { status: 'unavailable' };
}

export async function addAppointmentToCalendar(
  _calendarId: string,
  _input: CalendarEventInput,
): Promise<CalendarSaveResult> {
  return { status: 'unavailable' };
}
