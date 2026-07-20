import type { Appointment, BookAppointmentInput, BookAppointmentResult } from './types';

export interface AppointmentRepository {
  book(input: BookAppointmentInput): Promise<BookAppointmentResult>;
  getAppointment(id: string): Promise<Appointment | null>;
  listAppointments(): Promise<readonly Appointment[]>;
}
