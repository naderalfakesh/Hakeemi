import * as Calendar from 'expo-calendar';

import type { CalendarEventInput, CalendarSaveResult } from './calendar';

export async function addAppointmentToCalendar(
  input: CalendarEventInput,
): Promise<CalendarSaveResult> {
  const permission = await Calendar.requestCalendarPermissions();

  if (!permission.granted) {
    return { status: 'denied' };
  }

  const calendars = await Calendar.getCalendars(Calendar.EntityTypes.EVENT);
  const writableCalendar = calendars.find((calendar) => calendar.allowsModifications);

  if (!writableCalendar) {
    return { status: 'unavailable' };
  }

  const event = await writableCalendar.createEvent({
    endDate: new Date(input.endsAt),
    notes: 'Hakeemi portfolio demo appointment. No sensitive health details are included.',
    startDate: new Date(input.startsAt),
    timeZone: input.timezone,
    title: `Hakeemi visit with ${input.providerName}`,
    ...(input.visitMode === 'video' ? { location: 'Video visit' } : {}),
  });

  return { eventId: event.id, status: 'added' };
}
