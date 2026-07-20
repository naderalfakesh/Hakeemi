export type CalendarEventInput = {
  endsAt: string;
  providerName: string;
  startsAt: string;
  timezone: string;
  visitMode: 'in_person' | 'video';
};

export type CalendarSaveResult =
  { eventId: string; status: 'added' } | { status: 'denied' | 'unavailable' };

export function addAppointmentToCalendar(input: CalendarEventInput): Promise<CalendarSaveResult>;
