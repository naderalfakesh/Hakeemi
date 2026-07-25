import AsyncStorage from '@react-native-async-storage/async-storage';

import { buildAvailabilityFixtures } from '@/features/care/data/fixtures';

import { AppointmentActionError } from '../domain/errors';
import type { AppointmentRepository } from '../domain/repository';
import type { Appointment, AppointmentActionResult, BookAppointmentResult } from '../domain/types';

const DEMO_APPOINTMENTS_KEY = '@hakeemi/demo-appointments/v1';
const DEMO_PATIENT_ID = 'demo-patient';

type DemoAppointmentState = {
  appointments: Appointment[];
  seedDate: string;
};

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
    return state.appointments.find((appointment) => appointment.id === id) ?? null;
  }

  public async listAppointments() {
    const state = await this.readState();
    return [...state.appointments].sort((left, right) =>
      left.startsAt.localeCompare(right.startsAt),
    );
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
      const state = await this.readState();
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

export function buildDemoAppointmentFixtures(referenceDate = new Date()): Appointment[] {
  return [
    createDemoAppointment(referenceDate, {
      clinicId: 'barari-medical-centre',
      dayOffset: 3,
      durationMinutes: 45,
      hourUtc: 6,
      id: 'demo-upcoming-omar',
      minuteUtc: 15,
      providerId: 'omar-rahman',
      reasonCategory: 'follow_up',
      slotId: 'demo-seeded-omar-upcoming',
      status: 'confirmed',
      visitMode: 'in_person',
    }),
    createDemoAppointment(referenceDate, {
      clinicId: 'harbour-telehealth',
      dayOffset: -9,
      durationMinutes: 30,
      hourUtc: 8,
      id: 'demo-completed-lina',
      minuteUtc: 0,
      providerId: 'lina-haddad',
      reasonCategory: 'routine_visit',
      slotId: 'demo-seeded-lina-completed',
      status: 'completed',
      visitMode: 'video',
    }),
    createDemoAppointment(referenceDate, {
      clinicId: 'marsa-family-clinic',
      dayOffset: -18,
      durationMinutes: 30,
      hourUtc: 11,
      id: 'demo-cancelled-priya',
      minuteUtc: 30,
      providerId: 'priya-menon',
      reasonCategory: 'new_concern',
      slotId: 'demo-seeded-priya-cancelled',
      status: 'cancelled',
      visitMode: 'in_person',
    }),
  ];
}

function createDemoAppointment(
  referenceDate: Date,
  template: {
    clinicId: string | null;
    dayOffset: number;
    durationMinutes: number;
    hourUtc: number;
    id: string;
    minuteUtc: number;
    providerId: string;
    reasonCategory: Appointment['reasonCategory'];
    slotId: string;
    status: Appointment['status'];
    visitMode: Appointment['visitMode'];
  },
): Appointment {
  const startsAt = new Date(referenceDate);
  startsAt.setUTCHours(template.hourUtc, template.minuteUtc, 0, 0);
  startsAt.setUTCDate(startsAt.getUTCDate() + template.dayOffset);
  const createdAt = new Date(startsAt.getTime() - 7 * 24 * 60 * 60 * 1_000);
  const cancelledAt =
    template.status === 'cancelled'
      ? new Date(createdAt.getTime() + 24 * 60 * 60 * 1_000).toISOString()
      : null;

  return {
    cancelledAt,
    cancelledBy: cancelledAt ? 'patient' : null,
    clinicId: template.clinicId,
    createdAt: createdAt.toISOString(),
    endsAt: new Date(startsAt.getTime() + template.durationMinutes * 60_000).toISOString(),
    id: template.id,
    patientId: DEMO_PATIENT_ID,
    providerId: template.providerId,
    reasonCategory: template.reasonCategory,
    slotId: template.slotId,
    startsAt: startsAt.toISOString(),
    status: template.status,
    timezone: 'Asia/Dubai',
    updatedAt: cancelledAt ?? createdAt.toISOString(),
    visitMode: template.visitMode,
  };
}

function findAppointment(state: DemoAppointmentState, appointmentId: string) {
  const appointment = state.appointments.find((candidate) => candidate.id === appointmentId);

  if (!appointment) {
    throw new AppointmentActionError('not-found', 'That demo appointment does not exist.');
  }

  return appointment;
}

function parseStoredState(value: unknown): DemoAppointmentState | null {
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
