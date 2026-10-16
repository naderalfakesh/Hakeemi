import { act, render } from '@testing-library/react-native';
import { Text } from 'react-native';

import { useAuthSession } from '@/features/auth/context/auth-session-provider';
import {
  flushPendingNotificationDeregistrations,
  registerForAppointmentNotifications,
  stopNotificationTokenRefresh,
} from '@/services/notifications/notifications';

import {
  NotificationRegistrationProvider,
  useNotificationRegistration,
} from './notification-registration-provider';

jest.mock('@/features/auth/context/auth-session-provider', () => ({
  useAuthSession: jest.fn(),
}));
jest.mock('@/features/preferences/context/app-preferences-provider', () => ({
  useAppPreferences: () => ({ preferences: { locale: 'en', theme: 'system' } }),
}));
jest.mock('@/services/notifications/notifications', () => ({
  flushPendingNotificationDeregistrations: jest.fn(async () => undefined),
  registerForAppointmentNotifications: jest.fn(async () => ({ status: 'unavailable' })),
  stopNotificationTokenRefresh: jest.fn(),
}));

const mockedUseAuthSession = jest.mocked(useAuthSession);
const mockedFlush = jest.mocked(flushPendingNotificationDeregistrations);
const mockedRegister = jest.mocked(registerForAppointmentNotifications);
const mockedStopRefresh = jest.mocked(stopNotificationTokenRefresh);

function sessionFor(userId: string | null) {
  return {
    status: userId ? 'authenticated' : 'anonymous',
    user: userId ? { displayName: null, email: null, emailVerified: true, id: userId } : null,
  } as unknown as ReturnType<typeof useAuthSession>;
}

function Probe() {
  const registration = useNotificationRegistration();

  return <Text onPress={registration.enable}>{registration.status}</Text>;
}

describe('NotificationRegistrationProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('retries pending sign-out deregistrations whenever an account is signed in', async () => {
    mockedUseAuthSession.mockReturnValue(sessionFor(null));
    const view = await render(
      <NotificationRegistrationProvider>
        <Probe />
      </NotificationRegistrationProvider>,
    );
    expect(mockedFlush).not.toHaveBeenCalled();

    mockedUseAuthSession.mockReturnValue(sessionFor('user-a'));
    await act(async () => {
      view.rerender(
        <NotificationRegistrationProvider>
          <Probe />
        </NotificationRegistrationProvider>,
      );
    });
    expect(mockedFlush).toHaveBeenCalledTimes(1);

    mockedUseAuthSession.mockReturnValue(sessionFor(null));
    await act(async () => {
      view.rerender(
        <NotificationRegistrationProvider>
          <Probe />
        </NotificationRegistrationProvider>,
      );
    });
    mockedUseAuthSession.mockReturnValue(sessionFor('user-b'));
    await act(async () => {
      view.rerender(
        <NotificationRegistrationProvider>
          <Probe />
        </NotificationRegistrationProvider>,
      );
    });

    expect(mockedFlush).toHaveBeenCalledTimes(2);
    expect(mockedStopRefresh).toHaveBeenCalled();
    expect(mockedRegister).not.toHaveBeenCalled();
  });
});
