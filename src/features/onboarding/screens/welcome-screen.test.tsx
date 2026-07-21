import { fireEvent, render } from '@testing-library/react-native';

import { AppLocaleProvider } from '@/localization/locale-provider';
import { AppThemeProvider } from '@/theme';

import { WelcomeScreen } from './welcome-screen';

describe('WelcomeScreen', () => {
  it('owns the signed-out account and demo choices', async () => {
    const onCreateAccount = jest.fn();
    const onExploreDemo = jest.fn();
    const onSignIn = jest.fn();
    const view = await render(
      <AppThemeProvider colorScheme="light">
        <WelcomeScreen
          onCreateAccount={onCreateAccount}
          onExploreDemo={onExploreDemo}
          onSignIn={onSignIn}
        />
      </AppThemeProvider>,
    );

    expect(view.getByRole('header', { name: 'Welcome to Hakeemi' })).toBeOnTheScreen();

    await fireEvent.press(view.getByRole('button', { name: 'Create account' }));
    await fireEvent.press(view.getByRole('button', { name: 'Sign in' }));
    await fireEvent.press(
      view.getByRole('button', { name: 'Explore the Hakeemi demo without an account' }),
    );

    expect(onCreateAccount).toHaveBeenCalledTimes(1);
    expect(onSignIn).toHaveBeenCalledTimes(1);
    expect(onExploreDemo).toHaveBeenCalledTimes(1);
  });

  it('renders in Arabic', async () => {
    const view = await render(
      <AppThemeProvider colorScheme="light">
        <AppLocaleProvider locale="ar">
          <WelcomeScreen
            onCreateAccount={jest.fn()}
            onExploreDemo={jest.fn()}
            onSignIn={jest.fn()}
          />
        </AppLocaleProvider>
      </AppThemeProvider>,
    );

    expect(view.getByRole('header', { name: 'مرحبًا بك في حكيمي' })).toBeOnTheScreen();
    expect(view.getByRole('button', { name: 'إنشاء حساب' })).toBeOnTheScreen();
    expect(view.getByRole('button', { name: 'تسجيل الدخول' })).toBeOnTheScreen();
  });
});
