import type { CalendarEventInput, CalendarSaveResult } from './calendar';

export async function addAppointmentToCalendar(
  _input: CalendarEventInput,
): Promise<CalendarSaveResult> {
  return { status: 'unavailable' };
}
