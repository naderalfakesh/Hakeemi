import { act, render, waitFor } from '@testing-library/react-native';
import { Text } from 'react-native';

import {
  getCurrentAuthUser,
  observeAuthState,
  signOut as signOutFromFirebase,
} from '../data/firebase-auth';
import { demoSessionStorage } from '../data/demo-session-storage';
import { bootstrapUserProfile } from '../data/profile-bootstrap';
import type { AuthUser } from '../domain/types';
import { AuthSessionProvider, useAuthSession } from './auth-session-provider';

jest.mock('../data/firebase-auth', () => ({
  getCurrentAuthUser: jest.fn(),
  observeAuthState: jest.fn(),
  signOut: jest.fn(),
}));

jest.mock('../data/demo-session-storage', () => ({
  demoSessionStorage: {
    clear: jest.fn(),
    enable: jest.fn(),
    isEnabled: jest.fn(),
  },
}));

jest.mock('../data/profile-bootstrap', () => ({
  bootstrapUserProfile: jest.fn(),
}));

const mockedObserveAuthState = jest.mocked(observeAuthState);
const mockedGetCurrentAuthUser = jest.mocked(getCurrentAuthUser);
const mockedBootstrapUserProfile = jest.mocked(bootstrapUserProfile);
const mockedSignOut = jest.mocked(signOutFromFirebase);
const mockedDemoSessionStorage = jest.mocked(demoSessionStorage);

let authListener: (user: AuthUser | null) => void;

function SessionProbe() {
  const session = useAuthSession();

  return (
    <>
      <Text>
        {session.status}:{session.profileStatus}:{session.user?.email ?? 'none'}
      </Text>
      <Text onPress={session.enterDemo}>enter-demo</Text>
    </>
  );
}

describe('AuthSessionProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedObserveAuthState.mockImplementation((listener) => {
      authListener = listener;
      return jest.fn();
    });
    mockedGetCurrentAuthUser.mockResolvedValue(null);
    mockedSignOut.mockResolvedValue(undefined);
    mockedDemoSessionStorage.clear.mockResolvedValue(undefined);
    mockedDemoSessionStorage.enable.mockResolvedValue(undefined);
    mockedDemoSessionStorage.isEnabled.mockResolvedValue(false);
    mockedBootstrapUserProfile.mockResolvedValue({
      displayName: 'Demo Patient',
      email: 'demo@example.test',
      id: 'demo-user',
      locale: 'en',
      photoURL: null,
      role: 'patient',
      theme: 'system',
    });
  });

  it('restores an authenticated user and bootstraps one server profile', async () => {
    const view = await render(
      <AuthSessionProvider>
        <SessionProbe />
      </AuthSessionProvider>,
    );

    await act(() =>
      authListener({
        displayName: 'Demo Patient',
        email: 'demo@example.test',
        emailVerified: true,
        id: 'demo-user',
      }),
    );

    await waitFor(() =>
      expect(view.getByText('authenticated:ready:demo@example.test')).toBeOnTheScreen(),
    );
    expect(mockedBootstrapUserProfile).toHaveBeenCalledTimes(1);
  });

  it('settles an empty restored session as anonymous', async () => {
    const view = await render(
      <AuthSessionProvider>
        <SessionProbe />
      </AuthSessionProvider>,
    );

    await act(() => authListener(null));

    expect(view.getByText('anonymous:idle:none')).toBeOnTheScreen();
    expect(mockedBootstrapUserProfile).not.toHaveBeenCalled();
  });

  it('keeps an explicit demo session when the Firebase observer reports no account', async () => {
    const view = await render(
      <AuthSessionProvider>
        <SessionProbe />
      </AuthSessionProvider>,
    );

    await act(async () => {
      view.getByText('enter-demo').props.onPress();
      authListener(null);
    });

    expect(view.getByText('demo:idle:none')).toBeOnTheScreen();
    expect(mockedDemoSessionStorage.enable).toHaveBeenCalledTimes(1);
    expect(mockedBootstrapUserProfile).not.toHaveBeenCalled();
  });

  it('restores a persisted demo session without requiring an account', async () => {
    mockedDemoSessionStorage.isEnabled.mockResolvedValue(true);
    const view = await render(
      <AuthSessionProvider>
        <SessionProbe />
      </AuthSessionProvider>,
    );

    await act(() => authListener(null));

    await waitFor(() => expect(view.getByText('demo:idle:none')).toBeOnTheScreen());
    expect(mockedBootstrapUserProfile).not.toHaveBeenCalled();
  });
});
