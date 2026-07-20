import { act, renderHook, waitFor } from '@testing-library/react-native';

import { TestAppProviders } from '@/test/test-app-providers';

import type { AppointmentRepository } from '../domain/repository';
import type { BookAppointmentInput, BookAppointmentResult } from '../domain/types';
import { useBookAppointment } from './use-book-appointment';

const input: BookAppointmentInput = {
  reasonCategory: 'routine_visit',
  requestId: '018f47a2-65d1-7b21-9c43-ec2870b39f10',
  slotId: 'lina-slot',
};

const result: BookAppointmentResult = {
  appointment: {
    clinicId: 'marsa-family-clinic',
    endsAt: '2030-01-01T08:30:00.000Z',
    id: 'appointment-1',
    providerId: 'lina-haddad',
    reasonCategory: 'routine_visit',
    slotId: 'lina-slot',
    startsAt: '2030-01-01T08:00:00.000Z',
    status: 'confirmed',
    timezone: 'Asia/Dubai',
    visitMode: 'in_person',
  },
  isReplay: false,
};

function repository(book: jest.Mock): AppointmentRepository {
  return {
    book,
    cancel: jest.fn().mockRejectedValue(new Error('Inject an appointment repository in tests.')),
    getAppointment: jest.fn().mockResolvedValue(null),
    listAppointments: jest.fn().mockResolvedValue([]),
    reschedule: jest
      .fn()
      .mockRejectedValue(new Error('Inject an appointment repository in tests.')),
  };
}

describe('useBookAppointment', () => {
  it('never calls the booking service while offline', async () => {
    const book = jest.fn();
    const { result } = await renderHook(
      () =>
        useBookAppointment({
          checkConnection: jest.fn().mockResolvedValue(false),
          repository: repository(book),
        }),
      { wrapper: TestAppProviders },
    );

    await act(async () => {
      await expect(result.current.confirm(input)).rejects.toMatchObject({ code: 'network' });
    });

    await waitFor(() => expect(result.current.error?.code).toBe('network'));
    expect(book).not.toHaveBeenCalled();
  });

  it('submits one validated request while online', async () => {
    const book = jest.fn().mockResolvedValue(result);
    const hook = await renderHook(
      () =>
        useBookAppointment({
          checkConnection: jest.fn().mockResolvedValue(true),
          repository: repository(book),
        }),
      { wrapper: TestAppProviders },
    );

    await act(async () => expect(hook.result.current.confirm(input)).resolves.toEqual(result));
    expect(book).toHaveBeenCalledWith(input);
  });
});
