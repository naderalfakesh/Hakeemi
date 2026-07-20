import type {
  Appointment,
  AppointmentActionResult,
  BookAppointmentInput,
  BookAppointmentResult,
  CancelAppointmentInput,
  RescheduleAppointmentInput,
} from './types';

export interface AppointmentRepository {
  book(input: BookAppointmentInput): Promise<BookAppointmentResult>;
  cancel(input: CancelAppointmentInput): Promise<AppointmentActionResult>;
  getAppointment(id: string): Promise<Appointment | null>;
  listAppointments(): Promise<readonly Appointment[]>;
  reschedule(input: RescheduleAppointmentInput): Promise<AppointmentActionResult>;
}
