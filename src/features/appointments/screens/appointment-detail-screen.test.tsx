import { fireEvent, render, waitFor } from '@testing-library/react-native';

import { useAuthSession } from '@/features/auth/context/auth-session-provider';
import { fixtureCareRepository } from '@/features/care/data/fixture-care-repository';
import { TestAppProviders } from '@/test/test-app-providers';

import type { AppointmentRepository } from '../domain/repository';
import type { Appointment, AppointmentActionResult } from '../domain/types';
import { AppointmentDetailScreen } from './appointment-detail-screen';

jest.mock('@/features/auth/context/auth-session-provider', () => ({
  useAuthSession: jest.fn(),
}));

const mockedUseAuthSession = jest.mocked(useAuthSession);

const appointment: Appointment = {
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
  },
  isReplay: false,
};

function repository(overrides: Partial<AppointmentRepository> = {}): AppointmentRepository {
  return {
    book: jest.fn().mockRejectedValue(new Error('not used')),
    cancel: jest.fn().mockResolvedValue(actionResult),
    getAppointment: jest.fn().mockResolvedValue(appointment),
    listAppointments: jest.fn().mockResolvedValue([appointment]),
    reschedule: jest.fn().mockResolvedValue(actionResult),
    ...overrides,
  };
}

describe('AppointmentDetailScreen', () => {
  beforeEach(() => {
    mockedUseAuthSession.mockReturnValue({
      profile: null,
      profileError: null,
      profileStatus: 'idle',
      refreshSession: jest.fn().mockResolvedValue(undefined),
      retryProfile: jest.fn().mockResolvedValue(undefined),
      signOut: jest.fn().mockResolvedValue(undefined),
      status: 'authenticated',
      user: {
        displayName: 'Demo Patient',
        email: 'demo@example.test',
        emailVerified: true,
        id: 'patient-1',
      },
    });
  });

  it('shows appointment actions and sends cancellation through the repository', async () => {
    const cancel = jest.fn().mockResolvedValue(actionResult);
    const view = await render(
      <TestAppProviders>
        <AppointmentDetailScreen
          appointmentId={appointment.id}
          appointmentRepository={repository({ cancel })}
          careDataRepository={fixtureCareRepository}
          createRequestId={() => 'request-1'}
          onBack={jest.fn()}
          onFindCare={jest.fn()}
        />
      </TestAppProviders>,
    );

    await waitFor(() =>
      expect(view.getByRole('header', { name: 'Dr. Lina Haddad' })).toBeVisible(),
    );
    fireEvent.press(view.getByRole('button', { name: 'Cancel appointment' }));
    expect(view.getByText('Cancel this appointment?')).toBeVisible();

    fireEvent.press(view.getByRole('button', { name: 'Confirm cancellation' }));
    await waitFor(() =>
      expect(cancel).toHaveBeenCalledWith({
        appointmentId: appointment.id,
        requestId: 'request-1',
      }),
    );
  });

  it('reveals available provider slots for rescheduling', async () => {
    const reschedule = jest.fn().mockResolvedValue(actionResult);
    const view = await render(
      <TestAppProviders>
        <AppointmentDetailScreen
          appointmentId={appointment.id}
          appointmentRepository={repository({ reschedule })}
          careDataRepository={fixtureCareRepository}
          createRequestId={() => 'request-2'}
          onBack={jest.fn()}
          onFindCare={jest.fn()}
        />
      </TestAppProviders>,
    );

    await waitFor(() => expect(view.getByRole('button', { name: 'Reschedule' })).toBeVisible());
    fireEvent.press(view.getByRole('button', { name: 'Reschedule' }));
    await waitFor(() => expect(view.getByText('Choose a new time')).toBeVisible());

    const moveButtons = view.getAllByRole('button', { name: 'Move here' });
    fireEvent.press(moveButtons[0]!);
    await waitFor(() => expect(reschedule).toHaveBeenCalled());
    expect(reschedule.mock.calls[0]?.[0]).toMatchObject({
      appointmentId: appointment.id,
      requestId: 'request-2',
    });
  });
});
