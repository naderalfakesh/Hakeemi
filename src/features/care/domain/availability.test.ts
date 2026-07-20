import {
  createAvailabilityWindow,
  MAX_AVAILABILITY_WINDOW_DAYS,
  parseAvailabilityWindow,
} from './availability';

describe('availability windows', () => {
  it('creates a stable 15-minute bucket after the booking lead time', () => {
    const first = createAvailabilityWindow(new Date('2026-07-20T08:01:00.000Z'));
    const second = createAvailabilityWindow(new Date('2026-07-20T08:10:00.000Z'));

    expect(first).toEqual(second);
    expect(first).toEqual({
      endsBefore: '2026-08-03T08:30:00.000Z',
      startsAtOrAfter: '2026-07-20T08:30:00.000Z',
    });
  });

  it('rejects inverted, malformed, or oversized windows', () => {
    expect(() => createAvailabilityWindow(new Date(), MAX_AVAILABILITY_WINDOW_DAYS + 1)).toThrow();
    expect(() =>
      parseAvailabilityWindow({
        endsBefore: '2026-07-20T08:00:00.000Z',
        startsAtOrAfter: '2026-07-20T09:00:00.000Z',
      }),
    ).toThrow('Invalid availability window');
    expect(() =>
      parseAvailabilityWindow({ endsBefore: 'not-a-date', startsAtOrAfter: 'also-not-a-date' }),
    ).toThrow('Invalid availability window');
  });
});
