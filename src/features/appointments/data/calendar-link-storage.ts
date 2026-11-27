import AsyncStorage from '@react-native-async-storage/async-storage';

import type { WritableCalendar } from '@/services/calendar/calendar';
import type { AppDataScope } from '@/services/query/data-scope';

import type { AppointmentCalendarLink } from '../domain/calendar-link';

const CALENDAR_LINK_PREFIX = '@hakeemi/calendar-link/v2/';

export type CalendarLinkOwner = 'demo' | `account:${string}`;

export function calendarLinkOwner(
  scope: AppDataScope,
  accountId: string | null,
): CalendarLinkOwner | null {
  if (scope === 'demo') {
    return 'demo';
  }

  return accountId ? `account:${accountId}` : null;
}

function linkKey(owner: CalendarLinkOwner, appointmentId: string) {
  return `${CALENDAR_LINK_PREFIX}${owner}/${appointmentId}`;
}

export interface CalendarLinkStorage {
  clear(owner: CalendarLinkOwner): Promise<void>;
  read(owner: CalendarLinkOwner, appointmentId: string): Promise<AppointmentCalendarLink | null>;
  remove(owner: CalendarLinkOwner, appointmentId: string): Promise<void>;
  write(
    owner: CalendarLinkOwner,
    appointmentId: string,
    link: AppointmentCalendarLink,
  ): Promise<void>;
}

export const calendarLinkStorage: CalendarLinkStorage = {
  async clear(owner) {
    const prefix = `${CALENDAR_LINK_PREFIX}${owner}/`;
    const keys = (await AsyncStorage.getAllKeys()).filter((key) => key.startsWith(prefix));

    if (keys.length > 0) {
      await AsyncStorage.multiRemove(keys);
    }
  },
  async read(owner, appointmentId) {
    const value = await AsyncStorage.getItem(linkKey(owner, appointmentId));

    if (!value) {
      return null;
    }

    try {
      return restoreCalendarLink(JSON.parse(value) as unknown);
    } catch {
      return null;
    }
  },
  remove: (owner, appointmentId) => AsyncStorage.removeItem(linkKey(owner, appointmentId)),
  write: (owner, appointmentId, link) =>
    AsyncStorage.setItem(linkKey(owner, appointmentId), JSON.stringify(link)),
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
