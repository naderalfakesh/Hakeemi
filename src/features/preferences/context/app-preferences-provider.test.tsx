import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { Pressable, Text } from 'react-native';

import { useAuthSession } from '@/features/auth/context/auth-session-provider';
import { TestAppProviders } from '@/test/test-app-providers';

import { readAppPreferences, writeAppPreferences } from '../data/firebase-preferences';
import { readLocalPreferences, writeLocalPreferences } from '../data/local-preferences';
import { AppPreferencesProvider, useAppPreferences } from './app-preferences-provider';

jest.mock('@/features/auth/context/auth-session-provider', () => ({
  useAuthSession: jest.fn(),
}));

jest.mock('../data/firebase-preferences', () => ({
  readAppPreferences: jest.fn(),
  writeAppPreferences: jest.fn(),
}));

jest.mock('../data/local-preferences', () => ({
  readLocalPreferences: jest.fn(),
  writeLocalPreferences: jest.fn(),
}));

const mockedUseAuthSession = jest.mocked(useAuthSession);
const mockedReadAppPreferences = jest.mocked(readAppPreferences);
const mockedWriteAppPreferences = jest.mocked(writeAppPreferences);
const mockedReadLocalPreferences = jest.mocked(readLocalPreferences);
const mockedWriteLocalPreferences = jest.mocked(writeLocalPreferences);

function PreferencesProbe() {
  const { preferences, status, update } = useAppPreferences();

  return (
    <>
      <Text>{`${status}:${preferences.locale}:${preferences.theme}`}</Text>
      <Pressable
        accessibilityRole="button"
        onPress={() => update({ ...preferences, theme: 'dark' })}
      >
        <Text>Choose dark</Text>
      </Pressable>
    </>
  );
}

describe('AppPreferencesProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseAuthSession.mockReturnValue({
      enterDemo: jest.fn(),
      profile: {
        displayName: 'Demo Patient',
        email: 'demo@example.test',
        id: 'demo-user',
        locale: 'en',
        photoURL: null,
        role: 'patient',
        theme: 'system',
      },
      profileError: null,
      profileStatus: 'ready',
      refreshSession: jest.fn(),
      retryProfile: jest.fn(),
      signOut: jest.fn(),
      status: 'authenticated',
      user: {
        displayName: 'Demo Patient',
        email: 'demo@example.test',
        emailVerified: true,
        id: 'demo-user',
      },
    });
    mockedReadAppPreferences.mockResolvedValue({ locale: 'ar', theme: 'light' });
    mockedWriteAppPreferences.mockResolvedValue(undefined);
    mockedReadLocalPreferences.mockResolvedValue(null);
    mockedWriteLocalPreferences.mockResolvedValue(undefined);
  });

  it('loads the owner preferences and applies an optimistic synchronized update', async () => {
    const view = await render(
      <TestAppProviders>
        <AppPreferencesProvider>
          <PreferencesProbe />
        </AppPreferencesProvider>
      </TestAppProviders>,
    );

    await waitFor(() => expect(view.getByText('ready:ar:light')).toBeOnTheScreen());
    await fireEvent.press(view.getByRole('button', { name: 'Choose dark' }));

    await waitFor(() => expect(view.getByText('ready:ar:dark')).toBeOnTheScreen());
    expect(mockedWriteAppPreferences).toHaveBeenCalledWith({ locale: 'ar', theme: 'dark' });
  });

  it('serves and persists device-local preferences for a guest session', async () => {
    mockedUseAuthSession.mockReturnValue({
      enterDemo: jest.fn(),
      profile: null,
      profileError: null,
      profileStatus: 'idle',
      refreshSession: jest.fn(),
      retryProfile: jest.fn(),
      signOut: jest.fn(),
      status: 'demo',
      user: null,
    });
    mockedReadLocalPreferences.mockResolvedValue({ locale: 'en', theme: 'light' });

    const view = await render(
      <TestAppProviders>
        <AppPreferencesProvider>
          <PreferencesProbe />
        </AppPreferencesProvider>
      </TestAppProviders>,
    );

    await waitFor(() => expect(view.getByText('ready:en:light')).toBeOnTheScreen());
    await fireEvent.press(view.getByRole('button', { name: 'Choose dark' }));

    await waitFor(() => expect(view.getByText('ready:en:dark')).toBeOnTheScreen());
    expect(mockedWriteLocalPreferences).toHaveBeenCalledWith({ locale: 'en', theme: 'dark' });
    expect(mockedWriteAppPreferences).not.toHaveBeenCalled();
  });

  it('rolls back an optimistic preference when Firestore rejects the write', async () => {
    mockedWriteAppPreferences.mockRejectedValue(new Error('offline'));
    const view = await render(
      <TestAppProviders>
        <AppPreferencesProvider>
          <PreferencesProbe />
        </AppPreferencesProvider>
      </TestAppProviders>,
    );

    await waitFor(() => expect(view.getByText('ready:ar:light')).toBeOnTheScreen());
    await fireEvent.press(view.getByRole('button', { name: 'Choose dark' }));

    await waitFor(() => expect(view.getByText('error:ar:light')).toBeOnTheScreen());
  });
});
