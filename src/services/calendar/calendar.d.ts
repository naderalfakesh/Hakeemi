export type CalendarEventInput = {
  endsAt: string;
  providerName: string;
  startsAt: string;
  timezone: string;
  visitMode: 'in_person' | 'video';
};

/** A device calendar the app may write into, named the way the user knows it. */
export type WritableCalendar = {
  /** The account that owns the calendar, or null when it equals the title. */
  accountName: string | null;
  id: string;
  title: string;
};

export type CalendarListResult =
  | { calendars: readonly WritableCalendar[]; status: 'ready' }
  | { status: 'denied' | 'unavailable' };

export type CalendarSaveResult =
  { eventId: string; status: 'added' } | { status: 'denied' | 'unavailable' };

export type CalendarEventTime = Pick<CalendarEventInput, 'endsAt' | 'startsAt' | 'timezone'>;

/**
 * `missing` means the event is gone (the user deleted it, or its calendar was
 * removed); `denied` means calendar access was withdrawn since it was added.
 */
export type CalendarEventChangeResult = { status: 'denied' | 'done' | 'missing' };

/**
 * Asks for calendar access in context and lists the calendars that accept new
 * events, the primary calendar of each account first.
 */
export function listWritableCalendars(): Promise<CalendarListResult>;

export function addAppointmentToCalendar(
  calendarId: string,
  input: CalendarEventInput,
): Promise<CalendarSaveResult>;

/** Moves an event the app created. Never prompts for access. */
export function moveAppointmentCalendarEvent(
  eventId: string,
  time: CalendarEventTime,
): Promise<CalendarEventChangeResult>;

/** Deletes an event the app created. Never prompts for access. */
export function removeAppointmentCalendarEvent(eventId: string): Promise<CalendarEventChangeResult>;
