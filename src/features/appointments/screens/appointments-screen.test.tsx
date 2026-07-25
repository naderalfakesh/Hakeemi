import { fireEvent, render, waitFor } from '@testing-library/react-native';

import { useAuthSession } from '@/features/auth/context/auth-session-provider';
import { fixtureCareRepository } from '@/features/care/data/fixture-care-repository';
import { TestAppProviders } from '@/test/test-app-providers';

import type { AppointmentRepository } from '../domain/repository';
import type { Appointment } from '../domain/types';
import { AppointmentsScreen } from './appointments-screen';

jest.mock('@/features/auth/context/auth-session-provider', () => ({
  useAuthSession: jest.fn(),
}));

const mockedUseAuthSession = jest.mocked(useAuthSession);

const upcomingAppointment: Appointment = {
  cancelledAt: null,
  cancelledBy: null,
  clinicId: 'marsa-family-clinic',
  createdAt: '2029-12-01T08:00:00.000Z',
  endsAt: '2030-01-15T08:30:00.000Z',
  id: 'demo-upcoming',
  patientId: 'demo-patient',
  providerId: 'lina-haddad',
  reasonCategory: 'routine_visit',
  slotId: 'demo-slot',
  startsAt: '2030-01-15T08:00:00.000Z',
  status: 'confirmed',
  timezone: 'Asia/Dubai',
  updatedAt: '2029-12-01T08:00:00.000Z',
  visitMode: 'in_person',
};

const repository: AppointmentRepository = {
  book: jest.fn().mockRejectedValue(new Error('not used')),
  cancel: jest.fn().mockRejectedValue(new Error('not used')),
  getAppointment: jest.fn().mockResolvedValue(upcomingAppointment),
  listAppointments: jest.fn().mockResolvedValue([upcomingAppointment]),
  reschedule: jest.fn().mockRejectedValue(new Error('not used')),
};

describe('AppointmentsScreen demo mode', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseAuthSession.mockReturnValue({
      enterDemo: jest.fn(),
      profile: null,
      profileError: null,
      profileStatus: 'idle',
      refreshSession: jest.fn().mockResolvedValue(undefined),
      retryProfile: jest.fn().mockResolvedValue(undefined),
      signOut: jest.fn().mockResolvedValue(undefined),
      status: 'demo',
      user: null,
    });
  });

  it('shows seeded appointments without presenting the sign-in gate', async () => {
    const onFindCare = jest.fn();
    const view = await render(
      <TestAppProviders>
        <AppointmentsScreen
          appointmentRepository={repository}
          careDataRepository={fixtureCareRepository}
          onFindCare={onFindCare}
          onSignIn={jest.fn()}
          queryScope="demo"
        />
      </TestAppProviders>,
    );

    await waitFor(() => expect(view.getByText('Dr. Lina Haddad')).toBeVisible());
    expect(view.queryByRole('button', { name: 'Sign in' })).not.toBeOnTheScreen();
    expect(view.getByText('Upcoming')).toBeOnTheScreen();

    await fireEvent.press(view.getByRole('button', { name: 'Book another appointment' }));
    expect(onFindCare).toHaveBeenCalledTimes(1);
  });

  it('keeps the booking action available when the appointment list is empty', async () => {
    const onFindCare = jest.fn();
    const emptyRepository: AppointmentRepository = {
      ...repository,
      listAppointments: jest.fn().mockResolvedValue([]),
    };
    const view = await render(
      <TestAppProviders>
        <AppointmentsScreen
          appointmentRepository={emptyRepository}
          careDataRepository={fixtureCareRepository}
          onFindCare={onFindCare}
          onSignIn={jest.fn()}
          queryScope="demo"
        />
      </TestAppProviders>,
    );

    await waitFor(() => expect(view.getByText('No upcoming appointments')).toBeVisible());
    await fireEvent.press(view.getByRole('button', { name: 'Book an appointment' }));

    expect(onFindCare).toHaveBeenCalledTimes(1);
  });
});
