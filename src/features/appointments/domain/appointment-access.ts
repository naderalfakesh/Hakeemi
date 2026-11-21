import type { Appointment } from './types';

export function canManageAppointment(
  appointment: Pick<Appointment, 'startsAt' | 'status'>,
  now = new Date(),
) {
  return appointment.status === 'confirmed' && new Date(appointment.startsAt) > now;
}
