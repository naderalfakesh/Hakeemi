import { formatAppointmentTime, daysUntil } from './format-appointment-time';
import { nextVisitStrings } from './next-visit-strings';

describe('daysUntil', () => {
  const now = new Date(2026, 6, 25, 23, 30);

  it('counts calendar days, so tomorrow morning is one day away late tonight', () => {
    expect(daysUntil(new Date(2026, 6, 26, 9, 0).toISOString(), now)).toBe(1);
    expect(daysUntil(new Date(2026, 6, 25, 23, 45).toISOString(), now)).toBe(0);
    expect(daysUntil(new Date(2026, 6, 30, 8, 0).toISOString(), now)).toBe(5);
  });

  it('words the distance in English and Arabic', () => {
    expect([0, 1, 5].map(nextVisitStrings.en.when)).toEqual(['Today', 'Tomorrow', 'In 5 days']);
    expect([1, 2, 5, 12].map(nextVisitStrings.ar.when)).toEqual([
      'غدًا',
      'بعد يومين',
      'بعد 5 أيام',
      'بعد 12 يومًا',
    ]);
  });
});

describe('formatAppointmentTime', () => {
  it('shows the time in the clinic time zone', () => {
    expect(
      formatAppointmentTime({ startsAt: '2026-07-26T05:30:00.000Z', timezone: 'Asia/Dubai' }, 'en'),
    ).toBe('Jul 26, 2026, 9:30 AM');
  });
});
