import { formatAppointmentReference } from './reference';

describe('formatAppointmentReference', () => {
  it('uses the random tail of a server id', () => {
    expect(formatAppointmentReference('appt_7f3ca40d9f605a')).toBe('A40D9F605A');
  });

  it('never shows words from a readable id', () => {
    const reference = formatAppointmentReference('demo-upcoming-omar');

    expect(reference).toMatch(/^[0-9A-F]{10}$/u);
    expect(reference).toBe(formatAppointmentReference('demo-upcoming-omar'));
    expect(reference).not.toBe(formatAppointmentReference('demo-cancelled-priya'));
  });
});
