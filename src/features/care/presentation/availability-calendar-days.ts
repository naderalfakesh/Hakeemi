import type { AvailabilitySlot, AvailabilityWindow } from '../domain/types';

const DAY_MS = 24 * 60 * 60 * 1_000;

export type AvailabilityCalendarDay = {
  date: Date;
  dateKey: string;
  slots: readonly AvailabilitySlot[];
};

export function buildAvailabilityCalendarDays(
  availabilityWindow: AvailabilityWindow,
  timezone: string,
  slots: readonly AvailabilitySlot[],
): readonly AvailabilityCalendarDay[] {
  const startsAt = new Date(availabilityWindow.startsAtOrAfter);
  const endsBefore = new Date(availabilityWindow.endsBefore);
  const dayCount = Math.max(
    1,
    Math.min(31, Math.ceil((endsBefore.getTime() - startsAt.getTime()) / DAY_MS)),
  );
  const slotsByDay = new Map<string, AvailabilitySlot[]>();

  for (const slot of slots) {
    const dateKey = formatDateKey(new Date(slot.startsAt), slot.timezone);
    const daySlots = slotsByDay.get(dateKey) ?? [];
    daySlots.push(slot);
    slotsByDay.set(dateKey, daySlots);
  }

  return Array.from({ length: dayCount }, (_, offset) => {
    const instant = new Date(startsAt.getTime() + offset * DAY_MS);
    const dateKey = formatDateKey(instant, timezone);
    const [year, month, day] = dateKey.split('-').map(Number);

    return {
      date: new Date(Date.UTC(year ?? 1970, (month ?? 1) - 1, day ?? 1, 12)),
      dateKey,
      slots: [...(slotsByDay.get(dateKey) ?? [])].sort((left, right) =>
        left.startsAt.localeCompare(right.startsAt),
      ),
    };
  });
}

export function formatDateKey(date: Date, timezone: string) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    day: '2-digit',
    month: '2-digit',
    timeZone: timezone,
    year: 'numeric',
  }).formatToParts(date);
  const values = new Map(parts.map((part) => [part.type, part.value]));

  return `${values.get('year')}-${values.get('month')}-${values.get('day')}`;
}

export function formatCalendarRange(days: readonly AvailabilityCalendarDay[], locale: string) {
  const firstDay = days[0]?.date;
  const lastDay = days.at(-1)?.date;

  if (!firstDay || !lastDay) {
    return '';
  }

  const first = new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC',
  }).format(firstDay);
  const last = new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC',
    year: firstDay.getUTCFullYear() === lastDay.getUTCFullYear() ? undefined : 'numeric',
  }).format(lastDay);

  return `${first} – ${last}`;
}

// Arabic CLDR `short` weekdays are full words; use single-letter `narrow` form instead.
export function formatWeekday(date: Date, locale: string) {
  return new Intl.DateTimeFormat(locale, {
    timeZone: 'UTC',
    weekday: locale.startsWith('ar') ? 'narrow' : 'short',
  }).format(date);
}

export function dayGridColumns(fontScale: number) {
  return fontScale >= 1.3 ? 4 : 7;
}

export function formatDayNumber(date: Date, locale: string) {
  return new Intl.DateTimeFormat(locale, { day: 'numeric', timeZone: 'UTC' }).format(date);
}

export function formatFullDate(date: Date, locale: string) {
  return new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'long',
    timeZone: 'UTC',
    weekday: 'long',
  }).format(date);
}

export function formatSlotTime(slot: AvailabilitySlot, locale: string) {
  return new Intl.DateTimeFormat(locale, {
    hour: 'numeric',
    minute: '2-digit',
    timeZone: slot.timezone,
  }).format(new Date(slot.startsAt));
}

export function formatSlotDateSummary(slot: AvailabilitySlot, locale: string) {
  return new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'short',
    timeZone: slot.timezone,
    weekday: 'short',
  }).format(new Date(slot.startsAt));
}
