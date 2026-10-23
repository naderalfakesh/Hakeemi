import { planCalendarFollowUp } from './calendar-link';

describe('planCalendarFollowUp', () => {
  const link = { startsAt: '2030-10-24T12:00:00.000Z' };

  it('keeps an event that matches a confirmed visit', () => {
    expect(
      planCalendarFollowUp({ startsAt: '2030-10-24T12:00:00Z', status: 'confirmed' }, link),
    ).toBe('keep');
  });

  it('moves the event when the visit has a new time', () => {
    expect(
      planCalendarFollowUp({ startsAt: '2030-10-26T09:00:00.000Z', status: 'confirmed' }, link),
    ).toBe('move');
  });

  it('removes the event of a cancelled visit', () => {
    expect(planCalendarFollowUp({ startsAt: link.startsAt, status: 'cancelled' }, link)).toBe(
      'remove',
    );
  });

  it('leaves the event of a completed visit alone', () => {
    expect(
      planCalendarFollowUp({ startsAt: '2030-10-26T09:00:00.000Z', status: 'completed' }, link),
    ).toBe('keep');
  });
});
