import { AppointmentActionError } from '../domain/errors';
import type { AppointmentRepository } from '../domain/repository';

export const appointmentRepository: AppointmentRepository = {
  async book() {
    throw new AppointmentActionError(
      'unavailable',
      'Native booking is available in the iOS and Android development builds.',
    );
  },
  async getAppointment() {
    return null;
  },
  async listAppointments() {
    return [];
  },
};
