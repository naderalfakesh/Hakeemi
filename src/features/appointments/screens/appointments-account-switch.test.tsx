import { QueryClientProvider } from '@tanstack/react-query';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import { Text } from 'react-native';

import { AccountDataReset } from '@/features/auth/context/account-data-reset';
import { AuthSessionProvider, useAuthSession } from '@/features/auth/context/auth-session-provider';
import { demoSessionStorage } from '@/features/auth/data/demo-session-storage';
import {
  getCurrentAuthUser,
  observeAuthState,
  signOut as signOutFromFirebase,
} from '@/features/auth/data/firebase-auth';
import { bootstrapUserProfile } from '@/features/auth/data/profile-bootstrap';
import type { AuthUser } from '@/features/auth/domain/types';
import {
  BookingDraftProvider,
  useBookingDraft,
} from '@/features/booking/context/booking-draft-provider';
import type { BookingDraftStorage } from '@/features/booking/data/draft-storage';
import { fixtureCareRepository } from '@/features/care/data/fixture-care-repository';
import { createAppQueryClient } from '@/services/query/query-client';
import { AppThemeProvider } from '@/theme';

import { appointmentQueryKeys } from '../data/query-keys';
import type { AppointmentRepository } from '../domain/repository';
import type { Appointment } from '../domain/types';
import { AppointmentsScreen } from './appointments-screen';

jest.mock('@/features/auth/data/firebase-auth', () => ({
  getCurrentAuthUser: jest.fn(),
  observeAuthState: jest.fn(),
  signOut: jest.fn(),
}));

jest.mock('@/features/auth/data/demo-session-storage', () => ({
  demoSessionStorage: {
    clear: jest.fn(),
    enable: jest.fn(),
    isEnabled: jest.fn(),
  },
}));

jest.mock('@/features/auth/data/profile-bootstrap', () => ({
  bootstrapUserProfile: jest.fn(),
}));

const mockedObserveAuthState = jest.mocked(observeAuthState);
const mockedGetCurrentAuthUser = jest.mocked(getCurrentAuthUser);
const mockedSignOut = jest.mocked(signOutFromFirebase);
const mockedDemoSessionStorage = jest.mocked(demoSessionStorage);
const mockedBootstrapUserProfile = jest.mocked(bootstrapUserProfile);

const requestId = '018f47a2-65d1-7b21-9c43-ec2870b39f10';

const patientA: AuthUser = {
  displayName: 'Patient A',
  email: 'patient-a@example.test',
  emailVerified: true,
  id: 'patient-a',
};

const patientB: AuthUser = {
  displayName: 'Patient B',
  email: 'patient-b@example.test',
  emailVerified: true,
  id: 'patient-b',
};

const appointmentA: Appointment = {
  cancelledAt: null,
  cancelledBy: null,
  clinicId: 'marsa-family-clinic',
  createdAt: '2029-12-01T08:00:00.000Z',
  endsAt: '2030-01-15T08:30:00.000Z',
  id: 'appointment-a',
  patientId: patientA.id,
  providerId: 'lina-haddad',
  reasonCategory: 'routine_visit',
  slotId: 'lina-clinic-late',
  startsAt: '2030-01-15T08:00:00.000Z',
  status: 'confirmed',
  timezone: 'Asia/Dubai',
  updatedAt: '2029-12-01T08:00:00.000Z',
  visitMode: 'in_person',
};

const appointmentB: Appointment = {
  ...appointmentA,
  id: 'appointment-b',
  patientId: patientB.id,
  providerId: 'omar-rahman',
  slotId: 'omar-clinic-morning',
};

const appointmentsByPatient: Record<string, readonly Appointment[]> = {
  [patientA.id]: [appointmentA],
  [patientB.id]: [appointmentB],
};

// Mirrors the Firestore repository: the list depends on whoever is signed in.
let signedInPatientId: string | null = null;
let authListener: (user: AuthUser | null) => void = () => {};

const listAppointments = jest.fn(async () => {
  if (!signedInPatientId) {
    throw new Error('unauthenticated');
  }

  return appointmentsByPatient[signedInPatientId] ?? [];
});

const repository: AppointmentRepository = {
  book: jest.fn().mockRejectedValue(new Error('not used')),
  cancel: jest.fn().mockRejectedValue(new Error('not used')),
  getAppointment: jest.fn().mockResolvedValue(null),
  listAppointments,
  reschedule: jest.fn().mockRejectedValue(new Error('not used')),
};

function createDraftStorage(): BookingDraftStorage {
  return {
    clear: jest.fn().mockResolvedValue(undefined),
    read: jest.fn().mockResolvedValue(null),
    write: jest.fn().mockResolvedValue(undefined),
  };
}

function SessionProbe() {
  const session = useAuthSession();
  const bookingDraft = useBookingDraft();

  return (
    <>
      <Text onPress={() => void session.signOut()}>sign-out</Text>
      <Text onPress={() => void bookingDraft.selectSlot('lina-haddad', 'lina-clinic-late')}>
        select-slot
      </Text>
      <Text>draft:{bookingDraft.draft?.slotId ?? 'none'}</Text>
    </>
  );
}

async function renderScenario() {
  const storage = createDraftStorage();
  const queryClient = createAppQueryClient({ gcTime: Infinity, retry: false });
  const view = await render(
    <QueryClientProvider client={queryClient}>
      <AppThemeProvider colorScheme="light">
        <AuthSessionProvider>
          <BookingDraftProvider createRequestId={() => requestId} storage={storage}>
            <AccountDataReset />
            <SessionProbe />
            <AppointmentsScreen
              appointmentRepository={repository}
              careDataRepository={fixtureCareRepository}
              onFindCare={jest.fn()}
              onSignIn={jest.fn()}
            />
          </BookingDraftProvider>
        </AuthSessionProvider>
      </AppThemeProvider>
    </QueryClientProvider>,
  );

  // Firebase reports "no user" first, which settles the restored session as anonymous.
  await act(() => authListener(null));
  await waitFor(() => expect(view.getByRole('button', { name: 'Sign in' })).toBeOnTheScreen());

  return { queryClient, storage, view };
}

async function signIn(user: AuthUser) {
  signedInPatientId = user.id;
  await act(() => authListener(user));
}

async function signOut(view: Awaited<ReturnType<typeof render>>) {
  await fireEvent.press(view.getByText('sign-out'));
  await waitFor(() => expect(view.getByRole('button', { name: 'Sign in' })).toBeOnTheScreen());
}

describe('Appointments across a same-device account switch', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    signedInPatientId = null;
    mockedObserveAuthState.mockImplementation((listener) => {
      authListener = listener;
      return jest.fn();
    });
    mockedGetCurrentAuthUser.mockResolvedValue(null);
    mockedSignOut.mockImplementation(async () => {
      signedInPatientId = null;
      authListener(null);
    });
    mockedDemoSessionStorage.clear.mockResolvedValue(undefined);
    mockedDemoSessionStorage.enable.mockResolvedValue(undefined);
    mockedDemoSessionStorage.isEnabled.mockResolvedValue(false);
    mockedBootstrapUserProfile.mockImplementation(async () => ({
      displayName: 'Patient',
      email: `${signedInPatientId}@example.test`,
      id: signedInPatientId ?? 'none',
      locale: 'en',
      photoURL: null,
      role: 'patient',
      theme: 'system',
    }));
  });

  it('never shows account A appointments or draft to account B after sign-out and sign-in', async () => {
    const { queryClient, storage, view } = await renderScenario();

    await signIn(patientA);
    await waitFor(() => expect(view.getByText('Dr. Lina Haddad')).toBeVisible());
    expect(listAppointments).toHaveBeenCalledTimes(1);

    // The same account keeps its fresh cache: switching filters does not refetch.
    await fireEvent.press(view.getByText('Past'));
    await fireEvent.press(view.getByText('Upcoming'));
    await waitFor(() => expect(view.getByText('Dr. Lina Haddad')).toBeVisible());
    expect(listAppointments).toHaveBeenCalledTimes(1);

    await fireEvent.press(view.getByText('select-slot'));
    await waitFor(() => expect(view.getByText('draft:lina-clinic-late')).toBeOnTheScreen());

    await signOut(view);
    expect(view.queryByText('Dr. Lina Haddad')).not.toBeOnTheScreen();
    expect(
      queryClient.getQueryData(appointmentQueryKeys.list('account', patientA.id)),
    ).toBeUndefined();
    await waitFor(() => expect(view.getByText('draft:none')).toBeOnTheScreen());
    expect(storage.clear).toHaveBeenCalledTimes(1);

    await signIn(patientB);
    // Nothing from account A may be painted while account B's list is loading.
    expect(view.queryByText('Dr. Lina Haddad')).not.toBeOnTheScreen();

    await waitFor(() => expect(view.getByText('Dr. Omar Rahman')).toBeVisible());
    expect(view.queryByText('Dr. Lina Haddad')).not.toBeOnTheScreen();
    expect(listAppointments).toHaveBeenCalledTimes(2);
    expect(
      queryClient.getQueryData(appointmentQueryKeys.list('account', patientA.id)),
    ).toBeUndefined();
    expect(view.getByText('draft:none')).toBeOnTheScreen();
  });

  it('drops an account A response that resolves after account B has signed in', async () => {
    const { queryClient, view } = await renderScenario();
    let resolveAccountA: (appointments: readonly Appointment[]) => void = () => {};
    listAppointments.mockImplementationOnce(
      () =>
        new Promise<readonly Appointment[]>((resolve) => {
          resolveAccountA = resolve;
        }),
    );

    await signIn(patientA);
    await waitFor(() => expect(listAppointments).toHaveBeenCalledTimes(1));
    expect(view.getByLabelText('Loading appointments')).toBeOnTheScreen();

    await signOut(view);
    await signIn(patientB);

    await waitFor(() => expect(view.getByText('Dr. Omar Rahman')).toBeVisible());
    expect(listAppointments).toHaveBeenCalledTimes(2);

    await act(async () => {
      resolveAccountA([appointmentA]);
    });

    expect(view.queryByText('Dr. Lina Haddad')).not.toBeOnTheScreen();
    expect(view.getByText('Dr. Omar Rahman')).toBeVisible();
    expect(
      queryClient.getQueryData(appointmentQueryKeys.list('account', patientA.id)),
    ).toBeUndefined();
    expect(queryClient.getQueryData(appointmentQueryKeys.list('account', patientB.id))).toEqual([
      { appointment: appointmentB, provider: expect.objectContaining({ id: 'omar-rahman' }) },
    ]);
  });

  it('shows an error rather than account A data when account B is offline', async () => {
    const { queryClient, view } = await renderScenario();

    await signIn(patientA);
    await waitFor(() => expect(view.getByText('Dr. Lina Haddad')).toBeVisible());

    await signOut(view);
    listAppointments.mockRejectedValueOnce(new Error('offline'));
    await signIn(patientB);

    await waitFor(() => expect(view.getByText('Appointments unavailable')).toBeOnTheScreen());
    expect(view.queryByText('Dr. Lina Haddad')).not.toBeOnTheScreen();
    expect(listAppointments).toHaveBeenCalledTimes(2);
    expect(
      queryClient.getQueryData(appointmentQueryKeys.list('account', patientA.id)),
    ).toBeUndefined();

    // Retrying from the error state fetches account B's own list.
    await fireEvent.press(view.getByRole('button', { name: 'Try again' }));
    await waitFor(() => expect(view.getByText('Dr. Omar Rahman')).toBeVisible());
    expect(listAppointments).toHaveBeenCalledTimes(3);
  });

  it('refetches when the same account signs back in after signing out', async () => {
    const { view } = await renderScenario();

    await signIn(patientA);
    await waitFor(() => expect(view.getByText('Dr. Lina Haddad')).toBeVisible());

    await signOut(view);
    await signIn(patientA);

    await waitFor(() => expect(view.getByText('Dr. Lina Haddad')).toBeVisible());
    expect(listAppointments).toHaveBeenCalledTimes(2);
  });

  it('keeps a draft started while signed out so the sign-in redirect can resume booking', async () => {
    const { storage, view } = await renderScenario();

    await fireEvent.press(view.getByText('select-slot'));
    await waitFor(() => expect(view.getByText('draft:lina-clinic-late')).toBeOnTheScreen());

    await signIn(patientB);
    await waitFor(() => expect(view.getByText('Dr. Omar Rahman')).toBeVisible());

    expect(view.getByText('draft:lina-clinic-late')).toBeOnTheScreen();
    expect(storage.clear).not.toHaveBeenCalled();
  });
});
