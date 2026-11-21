import { render } from '@testing-library/react-native';

import { AppLocaleProvider } from '@/localization/locale-provider';
import { TestAppProviders } from '@/test/test-app-providers';

import { createAvailabilityWindow } from '../domain/availability';
import { buildAvailabilityFixtures } from '../data/fixtures';
import {
  buildAvailabilityCalendarDays,
  dayGridColumns,
  formatWeekday,
} from '../presentation/availability-calendar-days';
import { AvailabilityCalendar } from './availability-calendar';

describe('availability calendar', () => {
  it('maps the complete booking window and preserves unavailable days', () => {
    const now = new Date('2026-07-25T08:00:00.000Z');
    const slots = buildAvailabilityFixtures(now).filter(
      (slot) => slot.providerId === 'lina-haddad',
    );
    const days = buildAvailabilityCalendarDays(createAvailabilityWindow(now), 'Asia/Dubai', slots);

    expect(days).toHaveLength(14);
    expect(days[0]).toMatchObject({ dateKey: '2026-07-25', slots: [] });
    expect(days[1]?.slots.map(({ id }) => id)).toEqual([
      'lina-video-early',
      'lina-clinic-day-1-0700',
    ]);
    expect(days.filter((day) => day.slots.length === 0).length).toBeGreaterThan(0);
    expect(days.flatMap((day) => day.slots)).toHaveLength(7);
  });

  it('keeps the calendar visible when every day is unavailable', async () => {
    const now = new Date('2026-07-25T08:00:00.000Z');
    const view = await render(
      <TestAppProviders colorScheme="light">
        <AvailabilityCalendar
          availabilityWindow={createAvailabilityWindow(now)}
          locale="en"
          onChooseSlot={jest.fn()}
          slots={[]}
        />
      </TestAppProviders>,
    );

    expect(view.getByText('25 Jul – 7 Aug')).toBeOnTheScreen();
    expect(view.getByLabelText('Saturday, 25 July, no appointments available')).toBeDisabled();
    expect(view.queryByRole('button', { name: /Continue with/u })).not.toBeOnTheScreen();
  });

  it('uses weekday names that fit a chip in both languages', () => {
    const week = Array.from(
      { length: 7 },
      (_, offset) => new Date(Date.UTC(2026, 9, 18 + offset, 12)),
    );

    expect(week.map((day) => formatWeekday(day, 'en-AE'))).toEqual([
      'Sun',
      'Mon',
      'Tue',
      'Wed',
      'Thu',
      'Fri',
      'Sat',
    ]);
    // CLDR's Arabic "short" weekday is the whole word; the narrow letters are
    // distinct for every day and never break inside a word.
    const arabic = week.map((day) => formatWeekday(day, 'ar-AE'));
    expect(arabic).toEqual(['ح', 'ن', 'ث', 'ر', 'خ', 'ج', 'س']);
    expect(new Set(arabic).size).toBe(7);
  });

  it('reflows the day grid for large text', () => {
    expect(dayGridColumns(1)).toBe(7);
    expect(dayGridColumns(1.15)).toBe(7);
    expect(dayGridColumns(1.3)).toBe(4);
    expect(dayGridColumns(2)).toBe(4);
  });

  it('keeps the full date in Arabic day labels', async () => {
    const now = new Date('2026-07-25T08:00:00.000Z');
    const view = await render(
      <TestAppProviders colorScheme="light">
        <AppLocaleProvider locale="ar">
          <AvailabilityCalendar
            availabilityWindow={createAvailabilityWindow(now)}
            locale="ar"
            onChooseSlot={jest.fn()}
            slots={[]}
          />
        </AppLocaleProvider>
      </TestAppProviders>,
    );

    expect(view.getAllByText('س').length).toBeGreaterThan(0);
    expect(view.queryByText('السبت')).not.toBeOnTheScreen();
    expect(view.getAllByLabelText(/^السبت/u)[0]).toBeDisabled();
  });
});
