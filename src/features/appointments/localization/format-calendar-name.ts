import type { WritableCalendar } from '@/services/calendar/calendar';

export function formatCalendarName(calendar: WritableCalendar) {
  return calendar.accountName ? `${calendar.title} · ${calendar.accountName}` : calendar.title;
}
