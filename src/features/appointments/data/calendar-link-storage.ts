import AsyncStorage from '@react-native-async-storage/async-storage';

import type { WritableCalendar } from '@/services/calendar/calendar';

import type { AppointmentCalendarLink } from '../domain/calendar-link';

const CALENDAR_LINK_PREFIX = '@hakeemi/calendar-link/v1/';

/**
 * Device calendar event ids only mean something on this device, so the link
 * between an appointment and its event stays in local storage and never
 * reaches Firestore.
 */
export interface CalendarLinkStorage {
  read(appointmentId: string): Promise<AppointmentCalendarLink | null>;
  remove(appointmentId: string): Promise<void>;
  write(appointmentId: string, link: AppointmentCalendarLink): Promise<void>;
}

export const calendarLinkStorage: CalendarLinkStorage = {
  async read(appointmentId) {
    const value = await AsyncStorage.getItem(CALENDAR_LINK_PREFIX + appointmentId);

    if (!value) {
      return null;
    }

    try {
      return restoreCalendarLink(JSON.parse(value) as unknown);
    } catch {
      return null;
    }
  },
  remove: (appointmentId) => AsyncStorage.removeItem(CALENDAR_LINK_PREFIX + appointmentId),
  write: (appointmentId, link) =>
    AsyncStorage.setItem(CALENDAR_LINK_PREFIX + appointmentId, JSON.stringify(link)),
};

function restoreCalendarLink(value: unknown): AppointmentCalendarLink | null {
  if (!isRecord(value) || !isRecord(value.calendar)) {
    return null;
  }

  const { calendar, eventId, startsAt } = value;

  if (
    typeof eventId !== 'string' ||
    typeof startsAt !== 'string' ||
    typeof calendar.id !== 'string' ||
    typeof calendar.title !== 'string'
  ) {
    return null;
  }

  const restoredCalendar: WritableCalendar = {
    accountName: typeof calendar.accountName === 'string' ? calendar.accountName : null,
    id: calendar.id,
    title: calendar.title,
  };

  return { calendar: restoredCalendar, eventId, startsAt };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
