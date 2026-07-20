import { act, renderHook, waitFor } from '@testing-library/react-native';

import { TestAppProviders } from '@/test/test-app-providers';

import type { AppointmentRepository } from '../domain/repository';
import type { Appointment, AppointmentActionResult } from '../domain/types';
import { selectAppointments } from './use-appointments';
import { useCancelAppointment } from './use-cancel-appointment';
import { useRescheduleAppointment } from './use-reschedule-appointment';

const confirmedAppointment: Appointment = {
  cancelledAt: null,
  cancelledBy: null,
  clinicId: 'marsa-family-clinic',
  createdAt: '2030-01-01T07:00:00.000Z',
  endsAt: '2030-01-15T08:30:00.000Z',
  id: 'appointment-1',
  patientId: 'patient-1',
  providerId: 'lina-haddad',
  reasonCategory: 'routine_visit',
  slotId: 'slot-1',
  startsAt: '2030-01-15T08:00:00.000Z',
  status: 'confirmed',
  timezone: 'Asia/Dubai',
  updatedAt: '2030-01-01T07:00:00.000Z',
  visitMode: 'in_person',
};

const actionResult: AppointmentActionResult = {
  appointment: {
    cancelledAt: null,
    cancelledBy: null,
    clinicId: confirmedAppointment.clinicId,
    endsAt: confirmedAppointment.endsAt,
    id: confirmedAppointment.id,
    providerId: confirmedAppointment.providerId,
    reasonCategory: confirmedAppointment.reasonCategory,
    slotId: confirmedAppointment.slotId,
    startsAt: confirmedAppointment.startsAt,
    status: 'confirmed',
    timezone: confirmedAppointment.timezone,
    visitMode: confirmedAppointment.visitMode,
  },
  isReplay: false,
};

function repository(overrides: Partial<AppointmentRepository> = {}): AppointmentRepository {
  return {
    book: jest.fn().mockRejectedValue(new Error('not used')),
    cancel: jest.fn().mockResolvedValue(actionResult),
    getAppointment: jest.fn().mockResolvedValue(confirmedAppointment),
    listAppointments: jest.fn().mockResolvedValue([confirmedAppointment]),
    reschedule: jest.fn().mockResolvedValue(actionResult),
    ...overrides,
  };
}

describe('appointment management hooks', () => {
  it('does not call cancel while offline', async () => {
    const cancel = jest.fn();
    const hook = await renderHook(
      () =>
        useCancelAppointment({
          checkConnection: jest.fn().mockResolvedValue(false),
          repository: repository({ cancel }),
        }),
      { wrapper: TestAppProviders },
    );

    await act(async () => {
      await expect(
        hook.result.current.cancel({ appointmentId: 'appointment-1', requestId: 'request-1' }),
      ).rejects.toMatchObject({ code: 'network' });
    });

    await waitFor(() => expect(hook.result.current.error?.code).toBe('network'));
    expect(cancel).not.toHaveBeenCalled();
  });

  it('maps a server cancellation policy failure to a lifecycle error', async () => {
    const cancel = jest.fn().mockRejectedValue({ code: 'functions/failed-precondition' });
    const hook = await renderHook(
      () =>
        useCancelAppointment({
          checkConnection: jest.fn().mockResolvedValue(true),
          repository: repository({ cancel }),
        }),
      { wrapper: TestAppProviders },
    );

    await act(async () => {
      await expect(
        hook.result.current.cancel({ appointmentId: 'appointment-1', requestId: 'request-1' }),
      ).rejects.toMatchObject({ code: 'unavailable' });
    });

    expect(cancel).toHaveBeenCalledWith({ appointmentId: 'appointment-1', requestId: 'request-1' });
  });

  it('submits a reschedule through the repository boundary', async () => {
    const reschedule = jest.fn().mockResolvedValue(actionResult);
    const hook = await renderHook(
      () =>
        useRescheduleAppointment({
          checkConnection: jest.fn().mockResolvedValue(true),
          repository: repository({ reschedule }),
        }),
      { wrapper: TestAppProviders },
    );

    await act(async () => {
      await expect(
        hook.result.current.reschedule({
          appointmentId: 'appointment-1',
          requestId: 'request-2',
          slotId: 'slot-2',
        }),
      ).resolves.toEqual(actionResult);
    });

    expect(reschedule).toHaveBeenCalledWith({
      appointmentId: 'appointment-1',
      requestId: 'request-2',
      slotId: 'slot-2',
    });
  });
});

describe('appointment list filters', () => {
  const now = new Date('2030-01-10T00:00:00.000Z');
  const item = (status: Appointment['status'], startsAt: string) => ({
    appointment: { ...confirmedAppointment, id: `${status}-${startsAt}`, startsAt, status },
    provider: null,
  });
  const appointments = [
    item('confirmed', '2030-01-15T08:00:00.000Z'),
    item('confirmed', '2030-01-05T08:00:00.000Z'),
    item('cancelled', '2030-01-06T08:00:00.000Z'),
    item('completed', '2030-01-04T08:00:00.000Z'),
    item('no_show', '2030-01-03T08:00:00.000Z'),
  ];

  it('separates upcoming, history, and cancelled visits', () => {
    expect(selectAppointments(appointments, 'upcoming', now)).toHaveLength(1);
    expect(selectAppointments(appointments, 'past', now)).toHaveLength(3);
    expect(selectAppointments(appointments, 'cancelled', now)).toHaveLength(1);
  });
});
