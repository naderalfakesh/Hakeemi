import AsyncStorage from '@react-native-async-storage/async-storage';

import { buildAvailabilityFixtures } from '@/features/care/data/fixtures';

import { AppointmentActionError } from '../domain/errors';
import type { AppointmentRepository } from '../domain/repository';
import type { Appointment, AppointmentActionResult, BookAppointmentResult } from '../domain/types';
import { buildDemoAppointmentFixtures, DEMO_PATIENT_ID } from './demo-appointment-fixtures';
import {
  findAppointment,
  parseStoredState,
  type DemoAppointmentState,
} from './demo-appointment-state';

const DEMO_APPOINTMENTS_KEY = '@hakeemi/demo-appointments/v1';
export class DemoAppointmentRepository implements AppointmentRepository {
  private state: DemoAppointmentState | null = null;
  private mutationQueue: Promise<unknown> = Promise.resolve();

  public constructor(private readonly now: () => Date = () => new Date()) {}

  public async book(input: Parameters<AppointmentRepository['book']>[0]) {
    return this.mutate(async (state): Promise<BookAppointmentResult> => {
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
          (appointment) =>
            appointment.slotId === input.slotId && appointment.status === 'confirmed',
        )
      ) {
        throw new AppointmentActionError(
          'conflict',
          'That demo appointment time has already been reserved.',
        );
      }

      const slot = buildAvailabilityFixtures(this.now()).find(
        (candidate) => candidate.id === input.slotId,
      );

      if (!slot) {
        throw new AppointmentActionError(
          'not-found',
          'That demo appointment time is no longer available.',
        );
      }

      const timestamp = this.now().toISOString();
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
    });
  }

  public async cancel(input: Parameters<AppointmentRepository['cancel']>[0]) {
    return this.mutate(async (state): Promise<AppointmentActionResult> => {
      const appointment = findAppointment(state, input.appointmentId);

      if (appointment.status === 'cancelled') {
        return { appointment: toActionSummary(appointment), isReplay: true };
      }

      if (appointment.status !== 'confirmed' || new Date(appointment.startsAt) <= this.now()) {
        throw new AppointmentActionError(
          'unavailable',
          'This demo appointment can no longer be cancelled.',
        );
      }

      appointment.cancelledAt = this.now().toISOString();
      appointment.cancelledBy = 'patient';
      appointment.status = 'cancelled';
      appointment.updatedAt = appointment.cancelledAt;

      return { appointment: toActionSummary(appointment), isReplay: false };
    });
  }

  public async getAppointment(id: string) {
    const state = await this.readState();
    const appointment = state.appointments.find((candidate) => candidate.id === id);
    return appointment ? { ...appointment } : null;
  }

  public async listAppointments() {
    const state = await this.readState();
    return state.appointments
      .map((appointment) => ({ ...appointment }))
      .sort((left, right) => left.startsAt.localeCompare(right.startsAt));
  }

  public async reschedule(input: Parameters<AppointmentRepository['reschedule']>[0]) {
    return this.mutate(async (state): Promise<AppointmentActionResult> => {
      const appointment = findAppointment(state, input.appointmentId);

      if (appointment.slotId === input.slotId && appointment.status === 'confirmed') {
        return { appointment: toActionSummary(appointment), isReplay: true };
      }

      if (appointment.status !== 'confirmed' || new Date(appointment.startsAt) <= this.now()) {
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

      const slot = buildAvailabilityFixtures(this.now()).find(
        (candidate) => candidate.id === input.slotId,
      );

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
      appointment.updatedAt = this.now().toISOString();
      appointment.visitMode = slot.visitMode;

      return { appointment: toActionSummary(appointment), isReplay: false };
    });
  }

  private async mutate<Result>(
    operation: (state: DemoAppointmentState) => Promise<Result>,
  ): Promise<Result> {
    const pending = this.mutationQueue.then(async () => {
      // Operations change a copy, so objects already handed to the query
      // cache are never edited in place and a failed operation changes nothing.
      const current = await this.readState();
      const state: DemoAppointmentState = {
        ...current,
        appointments: current.appointments.map((appointment) => ({ ...appointment })),
      };
      const result = await operation(state);
      this.state = state;

      try {
        await AsyncStorage.setItem(DEMO_APPOINTMENTS_KEY, JSON.stringify(state));
      } catch {
        // Demo state remains usable in memory when device storage is unavailable.
      }

      return result;
    });

    this.mutationQueue = pending.then(
      () => undefined,
      () => undefined,
    );

    return pending;
  }

  private async readState() {
    const seedDate = this.now().toISOString().slice(0, 10);

    if (this.state?.seedDate === seedDate) {
      return this.state;
    }

    try {
      const storedValue = await AsyncStorage.getItem(DEMO_APPOINTMENTS_KEY);
      const storedState = storedValue ? parseStoredState(JSON.parse(storedValue) as unknown) : null;

      if (storedState?.seedDate === seedDate) {
        this.state = storedState;
        return storedState;
      }
    } catch {
      // Invalid or unavailable storage falls back to a fresh fictional seed.
    }

    const state = {
      appointments: buildDemoAppointmentFixtures(this.now()),
      seedDate,
    };
    this.state = state;

    try {
      await AsyncStorage.setItem(DEMO_APPOINTMENTS_KEY, JSON.stringify(state));
    } catch {
      // The in-memory seed still provides the complete demo journey.
    }

    return state;
  }
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

export const demoAppointmentRepository: AppointmentRepository = new DemoAppointmentRepository();
