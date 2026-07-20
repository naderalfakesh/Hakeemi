import { fireEvent, render } from '@testing-library/react-native';

import { AppLocaleProvider } from '@/localization/locale-provider';
import { AppThemeProvider } from '@/theme';
import type { Provider } from '@/features/care/domain/types';

import { ProfileScreen } from './profile-screen';

const noop = jest.fn().mockResolvedValue(undefined);
const savedProvider: Provider = {
  bio: { ar: 'ملف تعريفي خيالي لطبيبة.', en: 'A fictional clinician profile.' },
  clinicIds: ['marsa-family-clinic'],
  consultationFee: { amount: 340, currency: 'AED' },
  credentialSummary: { ar: 'MBBS · طب الأسرة', en: 'MBBS · Family medicine' },
  displayName: { ar: 'د. لينا حداد', en: 'Dr. Lina Haddad' },
  id: 'lina-haddad',
  image: null,
  isActive: true,
  isFeatured: true,
  languages: [
    { ar: 'الإنجليزية', en: 'English' },
    { ar: 'العربية', en: 'Arabic' },
  ],
  ratingSummary: { average: 4.8, count: 126 },
  slug: 'lina-haddad',
  specialtyIds: ['family-medicine'],
  visitModes: ['in_person', 'video'],
};

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
          onEnableNotifications={noop}
          onRetryPreferences={noop}
          onRetryProfile={noop}
          onSignIn={onSignIn}
          onSignOut={noop}
          onUpdatePreferences={noop}
          preferences={{ locale: 'en', theme: 'system' }}
          preferencesError={null}
          preferencesStatus="idle"
          notificationError={null}
          notificationStatus="idle"
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
          onEnableNotifications={noop}
          onRetryPreferences={noop}
          onRetryProfile={noop}
          onSignIn={noop}
          onSignOut={onSignOut}
          onUpdatePreferences={onUpdatePreferences}
          preferences={{ locale: 'en', theme: 'system' }}
          preferencesError={null}
          preferencesStatus="ready"
          notificationError={null}
          notificationStatus="idle"
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
    await fireEvent.press(view.getByRole('button', { name: 'Enable reminders' }));
    expect(noop).toHaveBeenCalled();
    await fireEvent.press(view.getByRole('button', { name: 'Dark' }));
    expect(onUpdatePreferences).toHaveBeenCalledWith({ locale: 'en', theme: 'dark' });
    await fireEvent.press(view.getByRole('button', { name: 'Sign out' }));
    expect(onSignOut).toHaveBeenCalledTimes(1);
  });

  it('shows saved clinicians and removes one from the shortlist', async () => {
    const onToggleSavedProvider = jest.fn();
    const view = await render(
      <AppThemeProvider colorScheme="light">
        <ProfileScreen
          onCreateAccount={noop}
          onEnableNotifications={noop}
          onRetryPreferences={noop}
          onRetryProfile={noop}
          onRetrySavedProviders={noop}
          onSignIn={noop}
          onSignOut={noop}
          onToggleSavedProvider={onToggleSavedProvider}
          onUpdatePreferences={noop}
          preferences={{ locale: 'en', theme: 'system' }}
          preferencesError={null}
          preferencesStatus="ready"
          notificationError={null}
          notificationStatus="registered"
          profile={null}
          profileError={null}
          profileStatus="ready"
          savedProviders={[savedProvider]}
          savedProvidersStatus="ready"
          user={{
            displayName: 'Demo Patient',
            email: 'demo@example.test',
            emailVerified: true,
            id: 'demo-user',
          }}
        />
      </AppThemeProvider>,
    );

    expect(view.getByText('Saved clinicians')).toBeOnTheScreen();
    await fireEvent.press(
      view.getByRole('button', { name: 'Remove Dr. Lina Haddad from saved clinicians' }),
    );
    expect(onToggleSavedProvider).toHaveBeenCalledWith('lina-haddad');
  });

  it('renders Arabic copy for a signed-in member', async () => {
    const view = await render(
      <AppLocaleProvider locale="ar">
        <AppThemeProvider colorScheme="light">
          <ProfileScreen
            onCreateAccount={noop}
            onEnableNotifications={noop}
            onRetryPreferences={noop}
            onRetryProfile={noop}
            onRetrySavedProviders={noop}
            onSignIn={noop}
            onSignOut={noop}
            onToggleSavedProvider={noop}
            onUpdatePreferences={noop}
            preferences={{ locale: 'ar', theme: 'system' }}
            preferencesError={null}
            preferencesStatus="ready"
            notificationError={null}
            notificationStatus="registered"
            profile={null}
            profileError={null}
            profileStatus="ready"
            savedProviders={[savedProvider]}
            savedProvidersStatus="ready"
            user={{
              displayName: 'Demo Patient',
              email: 'demo@example.test',
              emailVerified: true,
              id: 'demo-user',
            }}
          />
        </AppThemeProvider>
      </AppLocaleProvider>,
    );

    expect(view.getByRole('header', { name: 'الملف الشخصي' })).toBeOnTheScreen();
    expect(view.getByText('تم التحقق من البريد الإلكتروني')).toBeOnTheScreen();
    expect(view.getByText('الأطباء المحفوظون')).toBeOnTheScreen();
    expect(view.getByText('العربية')).toBeOnTheScreen();
    expect(view.getByText('English')).toBeOnTheScreen();
    expect(
      view.getByRole('button', { name: 'إزالة د. لينا حداد من الأطباء المحفوظين' }),
    ).toBeOnTheScreen();
    expect(view.getByRole('button', { name: 'تسجيل الخروج' })).toBeOnTheScreen();
  });
});
