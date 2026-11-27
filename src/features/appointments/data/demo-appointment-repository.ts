import AsyncStorage from '@react-native-async-storage/async-storage';

import { createSerialQueue } from '@/utils/async';

import type { AppointmentRepository } from '../domain/repository';
import type {
  BookAppointmentInput,
  CancelAppointmentInput,
  RescheduleAppointmentInput,
} from '../domain/types';
import { buildDemoAppointmentFixtures } from './demo-appointment-fixtures';
import {
  bookDemoAppointment,
  cancelDemoAppointment,
  rescheduleDemoAppointment,
} from './demo-appointment-mutations';
import { parseStoredState, type DemoAppointmentState } from './demo-appointment-state';

const DEMO_APPOINTMENTS_KEY = '@hakeemi/demo-appointments/v1';

export class DemoAppointmentRepository implements AppointmentRepository {
  private state: DemoAppointmentState | null = null;
  private readonly enqueueMutation = createSerialQueue();

  public constructor(private readonly now: () => Date = () => new Date()) {}

  public book(input: BookAppointmentInput) {
    return this.mutate((state) => bookDemoAppointment(state, input, this.now()));
  }

  public cancel(input: CancelAppointmentInput) {
    return this.mutate((state) => cancelDemoAppointment(state, input, this.now()));
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

  public reschedule(input: RescheduleAppointmentInput) {
    return this.mutate((state) => rescheduleDemoAppointment(state, input, this.now()));
  }

  private mutate<Result>(operation: (state: DemoAppointmentState) => Result): Promise<Result> {
    return this.enqueueMutation(async () => {
      const current = await this.readState();
      const nextState: DemoAppointmentState = {
        ...current,
        appointments: current.appointments.map((appointment) => ({ ...appointment })),
      };
      const result = operation(nextState);
      this.state = nextState;

      try {
        await AsyncStorage.setItem(DEMO_APPOINTMENTS_KEY, JSON.stringify(nextState));
      } catch {
        // Ignore storage failure; in-memory state stays usable.
      }

      return result;
    });
  }

  private async readState(): Promise<DemoAppointmentState> {
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
      // Fall back to a fresh seed when storage is unavailable or corrupt.
    }

    const state: DemoAppointmentState = {
      appointments: buildDemoAppointmentFixtures(this.now()),
      seedDate,
    };
    this.state = state;

    try {
      await AsyncStorage.setItem(DEMO_APPOINTMENTS_KEY, JSON.stringify(state));
    } catch {
      // Ignore storage failure; in-memory state stays usable.
    }

    return state;
  }
}

export const demoAppointmentRepository: AppointmentRepository = new DemoAppointmentRepository();
