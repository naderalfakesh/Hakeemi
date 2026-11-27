export type CalendarEventInput = {
  endsAt: string;
  providerName: string;
  startsAt: string;
  timezone: string;
  visitMode: 'in_person' | 'video';
};

export type WritableCalendar = {
  accountName: string | null;
  id: string;
  title: string;
};

export type CalendarListResult =
  | { calendars: readonly WritableCalendar[]; status: 'ready' }
  | { status: 'denied' | 'unavailable' };

export type CalendarSaveResult =
  { eventId: string; status: 'added' } | { status: 'denied' | 'unavailable' };

export type CalendarEventRef = { calendarId: string; eventId: string };

export type CalendarEventTime = Pick<CalendarEventInput, 'endsAt' | 'startsAt' | 'timezone'>;

export type CalendarEventChangeResult = { status: 'denied' | 'done' | 'missing' };

export function listWritableCalendars(): Promise<CalendarListResult>;

export function addAppointmentToCalendar(
  calendarId: string,
  input: CalendarEventInput,
): Promise<CalendarSaveResult>;

// Never prompts for calendar permission.
export function moveAppointmentCalendarEvent(
  ref: CalendarEventRef,
  time: CalendarEventTime,
): Promise<CalendarEventChangeResult>;

// Never prompts for calendar permission.
export function removeAppointmentCalendarEvent(
  ref: CalendarEventRef,
): Promise<CalendarEventChangeResult>;
