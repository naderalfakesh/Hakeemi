import type { WritableCalendar } from '@/services/calendar/calendar';

export type AppointmentCalendarState =
  | { status: 'idle' | 'working' | 'denied' | 'unavailable' | 'error' }
  | { calendars: readonly WritableCalendar[]; status: 'choosing' }
  | {
      calendar: WritableCalendar;
      /**
       * added: the event matches the visit. moved: it just followed a
       * reschedule. stale: it still has an earlier time, and only the user's
       * tap moves it. removed: it followed a cancellation. notRemoved: the
       * visit is cancelled but the event is still there. addedUntracked: the
       * event exists but its link could not be stored, so it will not follow
       * the visit.
       */
      status: 'added' | 'addedUntracked' | 'moved' | 'stale' | 'removed' | 'notRemoved';
    }
  /** The visit moved but its event is gone; offer to add the new time. */
  | { status: 'outdated' };
