import type { WritableCalendar } from '@/services/calendar/calendar';

export type AppointmentCalendarState =
  | { status: 'idle' | 'working' | 'denied' | 'unavailable' | 'error' }
  | { calendars: readonly WritableCalendar[]; status: 'choosing' }
  | {
      calendar: WritableCalendar;
      status: 'added' | 'addedUntracked' | 'moved' | 'stale' | 'removed' | 'notRemoved';
    }
  | { status: 'outdated' };
