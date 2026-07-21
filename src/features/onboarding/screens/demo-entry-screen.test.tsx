import { fireEvent, render } from '@testing-library/react-native';

import { AppLocaleProvider } from '@/localization/locale-provider';
import { AppThemeProvider } from '@/theme';

import { DemoEntryScreen } from './demo-entry-screen';

describe('DemoEntryScreen', () => {
  it('moves through onboarding and exposes auth choices at the end', async () => {
    const onContinue = jest.fn();
    const onSignIn = jest.fn();
    const onSignUp = jest.fn();
    const view = await render(
      <AppThemeProvider colorScheme="light">
        <DemoEntryScreen onContinue={onContinue} onSignIn={onSignIn} onSignUp={onSignUp} />
      </AppThemeProvider>,
    );

    expect(view.getByRole('header', { name: 'Care, without the runaround.' })).toBeOnTheScreen();
    expect(view.queryByRole('button', { name: 'Sign in' })).not.toBeOnTheScreen();
    expect(view.queryByRole('button', { name: 'Create account' })).not.toBeOnTheScreen();
    expect(view.queryByText(/No real clinicians/iu)).not.toBeOnTheScreen();

    await fireEvent.press(view.getByRole('button', { name: 'Show the next onboarding page' }));

    expect(view.getByRole('header', { name: 'Find the right clinician' })).toBeOnTheScreen();

    await fireEvent.press(view.getByRole('button', { name: 'Show the next onboarding page' }));

    expect(view.getByRole('header', { name: 'Book with confidence' })).toBeOnTheScreen();

    await fireEvent.press(view.getByRole('button', { name: 'Back' }));

    expect(view.getByRole('header', { name: 'Find the right clinician' })).toBeOnTheScreen();

    await fireEvent.press(view.getByRole('button', { name: 'Show the next onboarding page' }));
    await fireEvent.press(view.getByRole('button', { name: 'Show the next onboarding page' }));

    expect(view.getByRole('header', { name: 'Care in your language' })).toBeOnTheScreen();
    expect(view.getByRole('button', { name: 'Sign in' })).toBeOnTheScreen();
    expect(view.getByRole('button', { name: 'Create account' })).toBeOnTheScreen();

    await fireEvent.press(view.getByRole('button', { name: 'Explore the Hakeemi demo' }));

    expect(onContinue).toHaveBeenCalledTimes(1);

    await fireEvent.press(view.getByRole('button', { name: 'Sign in' }));

    expect(onSignIn).toHaveBeenCalledTimes(1);

    await fireEvent.press(view.getByRole('button', { name: 'Create account' }));

    expect(onSignUp).toHaveBeenCalledTimes(1);
  });

  it('can skip directly from the first page', async () => {
    const onContinue = jest.fn();
    const view = await render(
      <AppThemeProvider colorScheme="light">
        <DemoEntryScreen onContinue={onContinue} onSignIn={jest.fn()} onSignUp={jest.fn()} />
      </AppThemeProvider>,
    );

    await fireEvent.press(
      view.getByRole('button', {
        name: 'Skip onboarding and explore Hakeemi',
      }),
    );

    expect(onContinue).toHaveBeenCalledTimes(1);
  });

  it('renders the entry copy in Arabic', async () => {
    const view = await render(
      <AppThemeProvider colorScheme="light">
        <AppLocaleProvider locale="ar">
          <DemoEntryScreen onContinue={jest.fn()} onSignIn={jest.fn()} onSignUp={jest.fn()} />
        </AppLocaleProvider>
      </AppThemeProvider>,
    );

    expect(view.getByRole('header', { name: 'رعاية صحية، من دون تعقيدات.' })).toBeOnTheScreen();
    expect(view.getByRole('button', { name: 'اعرض صفحة التعريف التالية' })).toBeOnTheScreen();
    expect(view.queryByRole('button', { name: 'تسجيل الدخول' })).not.toBeOnTheScreen();
    expect(view.getByText('Hakeemi')).toBeOnTheScreen();
  });
});
