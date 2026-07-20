import type { AppointmentRepository } from '../domain/repository';

export const appointmentRepository: AppointmentRepository = {
  book: jest.fn().mockRejectedValue(new Error('Inject an appointment repository in tests.')),
  getAppointment: jest.fn().mockResolvedValue(null),
  listAppointments: jest.fn().mockResolvedValue([]),
};
