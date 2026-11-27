import { buildAvailabilityFixtures } from '@/features/care/data/fixtures';

import { AppointmentActionError } from '../domain/errors';
import type {
  Appointment,
  AppointmentActionResult,
  BookAppointmentInput,
  BookAppointmentResult,
  CancelAppointmentInput,
  RescheduleAppointmentInput,
} from '../domain/types';
import { DEMO_PATIENT_ID } from './demo-appointment-fixtures';
import { findAppointment, type DemoAppointmentState } from './demo-appointment-state';

export function bookDemoAppointment(
  state: DemoAppointmentState,
  input: BookAppointmentInput,
  now: Date,
): BookAppointmentResult {
  const appointmentId = `demo-appointment-${input.requestId}`;
  const replay = state.appointments.find((appointment) => appointment.id === appointmentId);

  if (replay) {
    if (
      replay.slotId !== input.slotId ||
      replay.reasonCategory !== input.reasonCategory ||
      replay.status !== 'confirmed'
    ) {
      throw new AppointmentActionError(
        'unavailable',
        'This demo booking request is already associated with another appointment.',
      );
    }

    return { appointment: toBookingSummary(replay), isReplay: true };
  }

  if (
    state.appointments.some(
      (appointment) => appointment.slotId === input.slotId && appointment.status === 'confirmed',
    )
  ) {
    throw new AppointmentActionError(
      'conflict',
      'That demo appointment time has already been reserved.',
    );
  }

  const slot = buildAvailabilityFixtures(now).find((candidate) => candidate.id === input.slotId);

  if (!slot) {
    throw new AppointmentActionError(
      'not-found',
      'That demo appointment time is no longer available.',
    );
  }

  const timestamp = now.toISOString();
  const appointment: Appointment = {
    cancelledAt: null,
    cancelledBy: null,
    clinicId: slot.clinicId,
    createdAt: timestamp,
    endsAt: slot.endsAt,
    id: appointmentId,
    patientId: DEMO_PATIENT_ID,
    providerId: slot.providerId,
    reasonCategory: input.reasonCategory,
    slotId: slot.id,
    startsAt: slot.startsAt,
    status: 'confirmed',
    timezone: slot.timezone,
    updatedAt: timestamp,
    visitMode: slot.visitMode,
  };

  state.appointments.push(appointment);
  return { appointment: toBookingSummary(appointment), isReplay: false };
}

export function cancelDemoAppointment(
  state: DemoAppointmentState,
  input: CancelAppointmentInput,
  now: Date,
): AppointmentActionResult {
  const appointment = findAppointment(state, input.appointmentId);

  if (appointment.status === 'cancelled') {
    return { appointment: toActionSummary(appointment), isReplay: true };
  }

  if (appointment.status !== 'confirmed' || new Date(appointment.startsAt) <= now) {
    throw new AppointmentActionError(
      'unavailable',
      'This demo appointment can no longer be cancelled.',
    );
  }

  appointment.cancelledAt = now.toISOString();
  appointment.cancelledBy = 'patient';
  appointment.status = 'cancelled';
  appointment.updatedAt = appointment.cancelledAt;

  return { appointment: toActionSummary(appointment), isReplay: false };
}

export function rescheduleDemoAppointment(
  state: DemoAppointmentState,
  input: RescheduleAppointmentInput,
  now: Date,
): AppointmentActionResult {
  const appointment = findAppointment(state, input.appointmentId);

  if (appointment.slotId === input.slotId && appointment.status === 'confirmed') {
    return { appointment: toActionSummary(appointment), isReplay: true };
  }

  if (appointment.status !== 'confirmed' || new Date(appointment.startsAt) <= now) {
    throw new AppointmentActionError(
      'unavailable',
      'This demo appointment can no longer be rescheduled.',
    );
  }

  if (
    state.appointments.some(
      (candidate) =>
        candidate.id !== appointment.id &&
        candidate.slotId === input.slotId &&
        candidate.status === 'confirmed',
    )
  ) {
    throw new AppointmentActionError(
      'conflict',
      'That demo appointment time has already been reserved.',
    );
  }

  const slot = buildAvailabilityFixtures(now).find((candidate) => candidate.id === input.slotId);

  if (!slot || slot.providerId !== appointment.providerId) {
    throw new AppointmentActionError(
      'not-found',
      'That demo appointment time is no longer available.',
    );
  }

  appointment.clinicId = slot.clinicId;
  appointment.endsAt = slot.endsAt;
  appointment.slotId = slot.id;
  appointment.startsAt = slot.startsAt;
  appointment.timezone = slot.timezone;
  appointment.updatedAt = now.toISOString();
  appointment.visitMode = slot.visitMode;

  return { appointment: toActionSummary(appointment), isReplay: false };
}

function toBookingSummary(appointment: Appointment): BookAppointmentResult['appointment'] {
  return {
    clinicId: appointment.clinicId,
    endsAt: appointment.endsAt,
    id: appointment.id,
    providerId: appointment.providerId,
    reasonCategory: appointment.reasonCategory,
    slotId: appointment.slotId,
    startsAt: appointment.startsAt,
    status: 'confirmed',
    timezone: appointment.timezone,
    visitMode: appointment.visitMode,
  };
}

function toActionSummary(appointment: Appointment): AppointmentActionResult['appointment'] {
  return {
    cancelledAt: appointment.cancelledAt,
    cancelledBy: appointment.cancelledBy,
    clinicId: appointment.clinicId,
    endsAt: appointment.endsAt,
    id: appointment.id,
    providerId: appointment.providerId,
    reasonCategory: appointment.reasonCategory,
    slotId: appointment.slotId,
    startsAt: appointment.startsAt,
    status: appointment.status,
    timezone: appointment.timezone,
    visitMode: appointment.visitMode,
  };
}
