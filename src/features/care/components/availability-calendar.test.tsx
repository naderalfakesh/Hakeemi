import { render } from '@testing-library/react-native';

import { TestAppProviders } from '@/test/test-app-providers';

import { createAvailabilityWindow } from '../domain/availability';
import { buildAvailabilityFixtures } from '../data/fixtures';
import { AvailabilityCalendar, buildAvailabilityCalendarDays } from './availability-calendar';

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
});
