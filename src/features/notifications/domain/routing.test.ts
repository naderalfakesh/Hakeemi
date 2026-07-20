import { parseAppointmentNotification } from './schemas';

describe('parseAppointmentNotification', () => {
  it('accepts a typed appointment reminder payload', () => {
    expect(
      parseAppointmentNotification({
        appointmentId: 'appointment-1',
        type: 'appointment_reminder',
      }),
    ).toBe('appointment-1');
  });

  it('rejects unknown notification types', () => {
    expect(
      parseAppointmentNotification({
        appointmentId: 'appointment-1',
        type: 'marketing',
      }),
    ).toBeNull();
  });

  it('rejects payloads that try to inject a route', () => {
    expect(
      parseAppointmentNotification({
        appointmentId: '../profile',
        type: 'appointment_reminder',
      }),
    ).toBeNull();
  });
});
