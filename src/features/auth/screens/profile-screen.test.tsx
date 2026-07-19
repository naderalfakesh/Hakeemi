import { fireEvent, render } from '@testing-library/react-native';

import { AppThemeProvider } from '@/theme';

import { ProfileScreen } from './profile-screen';

const noop = jest.fn().mockResolvedValue(undefined);

describe('ProfileScreen', () => {
  beforeEach(() => {
    noop.mockClear();
  });

  it('offers account entry points to a guest', async () => {
    const onSignIn = jest.fn();
    const view = await render(
      <AppThemeProvider colorScheme="light">
        <ProfileScreen
          onCreateAccount={noop}
          onRetryPreferences={noop}
          onRetryProfile={noop}
          onSignIn={onSignIn}
          onSignOut={noop}
          onUpdatePreferences={noop}
          preferences={{ locale: 'en', theme: 'system' }}
          preferencesError={null}
          preferencesStatus="idle"
          profile={null}
          profileError={null}
          profileStatus="idle"
          user={null}
        />
      </AppThemeProvider>,
    );

    expect(view.getByText('You’re exploring as a guest')).toBeOnTheScreen();
    await fireEvent.press(view.getByRole('button', { name: 'Sign in' }));
    expect(onSignIn).toHaveBeenCalledTimes(1);
  });

  it('shows the server-owned profile and signs out', async () => {
    const onSignOut = jest.fn().mockResolvedValue(undefined);
    const onUpdatePreferences = jest.fn();
    const view = await render(
      <AppThemeProvider colorScheme="light">
        <ProfileScreen
          onCreateAccount={noop}
          onRetryPreferences={noop}
          onRetryProfile={noop}
          onSignIn={noop}
          onSignOut={onSignOut}
          onUpdatePreferences={onUpdatePreferences}
          preferences={{ locale: 'en', theme: 'system' }}
          preferencesError={null}
          preferencesStatus="ready"
          profile={{
            displayName: 'Demo Patient',
            email: 'demo@example.test',
            id: 'demo-user',
            locale: 'en',
            photoURL: null,
            role: 'patient',
            theme: 'system',
          }}
          profileError={null}
          profileStatus="ready"
          user={{
            displayName: 'Demo Patient',
            email: 'demo@example.test',
            emailVerified: true,
            id: 'demo-user',
          }}
        />
      </AppThemeProvider>,
    );

    expect(view.getByText('Email verified')).toBeOnTheScreen();
    expect(view.getByText(/idempotent Cloud Function/iu)).toBeOnTheScreen();
    await fireEvent.press(view.getByRole('button', { name: 'Dark' }));
    expect(onUpdatePreferences).toHaveBeenCalledWith({ locale: 'en', theme: 'dark' });
    await fireEvent.press(view.getByRole('button', { name: 'Sign out' }));
    expect(onSignOut).toHaveBeenCalledTimes(1);
  });
});
