import { AppointmentActionError } from '../domain/errors';
import type { Appointment } from '../domain/types';
import { DEMO_PATIENT_ID } from './demo-appointment-fixtures';

export type DemoAppointmentState = {
  appointments: Appointment[];
  seedDate: string;
};

export function findAppointment(state: DemoAppointmentState, appointmentId: string) {
  const appointment = state.appointments.find((candidate) => candidate.id === appointmentId);

  if (!appointment) {
    throw new AppointmentActionError('not-found', 'That demo appointment does not exist.');
  }

  return appointment;
}

export function parseStoredState(value: unknown): DemoAppointmentState | null {
  if (
    typeof value !== 'object' ||
    value === null ||
    !('seedDate' in value) ||
    typeof value.seedDate !== 'string' ||
    !('appointments' in value) ||
    !Array.isArray(value.appointments) ||
    !value.appointments.every(isStoredAppointment)
  ) {
    return null;
  }

  return {
    appointments: value.appointments,
    seedDate: value.seedDate,
  };
}

function isStoredAppointment(value: unknown): value is Appointment {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    typeof value.id === 'string' &&
    'patientId' in value &&
    value.patientId === DEMO_PATIENT_ID &&
    'startsAt' in value &&
    typeof value.startsAt === 'string' &&
    'status' in value &&
    ['confirmed', 'cancelled', 'completed', 'no_show'].includes(String(value.status))
  );
}
