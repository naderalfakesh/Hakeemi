import * as Calendar from 'expo-calendar';

import type {
  CalendarEventChangeResult,
  CalendarEventInput,
  CalendarEventTime,
  CalendarListResult,
  CalendarSaveResult,
  WritableCalendar,
} from './calendar';

export async function listWritableCalendars(): Promise<CalendarListResult> {
  const permission = await Calendar.requestCalendarPermissions();

  if (!permission.granted) {
    return { status: 'denied' };
  }

  const calendars = await Calendar.getCalendars(Calendar.EntityTypes.EVENT);
  const writable = calendars
    .filter((calendar) => calendar.allowsModifications && calendar.isVisible !== false)
    .sort((left, right) => Number(right.isPrimary === true) - Number(left.isPrimary === true))
    .map(toWritableCalendar);

  return writable.length > 0 ? { calendars: writable, status: 'ready' } : { status: 'unavailable' };
}

export async function addAppointmentToCalendar(
  calendarId: string,
  input: CalendarEventInput,
): Promise<CalendarSaveResult> {
  const permission = await Calendar.getCalendarPermissions();

  if (!permission.granted) {
    return { status: 'denied' };
  }

  const calendars = await Calendar.getCalendars(Calendar.EntityTypes.EVENT);
  const calendar = calendars.find(
    (candidate) => candidate.id === calendarId && candidate.allowsModifications,
  );

  if (!calendar) {
    return { status: 'unavailable' };
  }

  const event = await calendar.createEvent({
    endDate: new Date(input.endsAt),
    notes: 'Hakeemi portfolio demo appointment. No sensitive health details are included.',
    startDate: new Date(input.startsAt),
    timeZone: input.timezone,
    title: `Hakeemi visit with ${input.providerName}`,
    ...(input.visitMode === 'video' ? { location: 'Video visit' } : {}),
  });

  return { eventId: event.id, status: 'added' };
}

export async function moveAppointmentCalendarEvent(
  eventId: string,
  time: CalendarEventTime,
): Promise<CalendarEventChangeResult> {
  return withExistingEvent(eventId, (event) =>
    event.update({
      endDate: new Date(time.endsAt),
      startDate: new Date(time.startsAt),
      timeZone: time.timezone,
    }),
  );
}

export async function removeAppointmentCalendarEvent(
  eventId: string,
): Promise<CalendarEventChangeResult> {
  return withExistingEvent(eventId, (event) => event.delete());
}

async function withExistingEvent(
  eventId: string,
  change: (event: Calendar.ExpoCalendarEvent) => Promise<void>,
): Promise<CalendarEventChangeResult> {
  // Following a reschedule or cancellation must never surprise the user with
  // a permission prompt, so only an existing grant is used.
  const permission = await Calendar.getCalendarPermissions();

  if (!permission.granted) {
    return { status: 'denied' };
  }

  let event: Calendar.ExpoCalendarEvent;

  try {
    event = await Calendar.ExpoCalendarEvent.get(eventId);
  } catch {
    return { status: 'missing' };
  }

  await change(event);

  return { status: 'done' };
}

function toWritableCalendar(calendar: Calendar.ExpoCalendar): WritableCalendar {
  // Android names each account's primary calendar after the account itself,
  // so repeating the account would read "name@example.com · name@example.com".
  const account = calendar.source?.name || calendar.ownerAccount || null;

  return {
    accountName: account && account !== calendar.title ? account : null,
    id: calendar.id,
    title: calendar.title,
  };
}
