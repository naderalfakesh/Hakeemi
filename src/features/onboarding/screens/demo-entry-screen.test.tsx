import { fireEvent, render } from '@testing-library/react-native';

import { AppLocaleProvider } from '@/localization/locale-provider';
import { AppThemeProvider } from '@/theme';

import { OnboardingScreen } from './demo-entry-screen';

describe('OnboardingScreen', () => {
  it('moves through the story and completes from the final page', async () => {
    const onComplete = jest.fn();
    const view = await render(
      <AppThemeProvider colorScheme="light">
        <OnboardingScreen onComplete={onComplete} onSkip={jest.fn()} />
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
    expect(view.queryByRole('button', { name: 'Sign in' })).not.toBeOnTheScreen();
    expect(view.queryByRole('button', { name: 'Create account' })).not.toBeOnTheScreen();

    await fireEvent.press(
      view.getByRole('button', { name: 'Finish onboarding and continue to welcome' }),
    );

    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it('can skip directly to welcome from the first page', async () => {
    const onSkip = jest.fn();
    const view = await render(
      <AppThemeProvider colorScheme="light">
        <OnboardingScreen onComplete={jest.fn()} onSkip={onSkip} />
      </AppThemeProvider>,
    );

    await fireEvent.press(
      view.getByRole('button', {
        name: 'Skip onboarding and continue to welcome',
      }),
    );

    expect(onSkip).toHaveBeenCalledTimes(1);
  });

  it('renders the entry copy in Arabic', async () => {
    const view = await render(
      <AppThemeProvider colorScheme="light">
        <AppLocaleProvider locale="ar">
          <OnboardingScreen onComplete={jest.fn()} onSkip={jest.fn()} />
        </AppLocaleProvider>
      </AppThemeProvider>,
    );

    expect(view.getByRole('header', { name: 'رعاية صحية، من دون تعقيدات.' })).toBeOnTheScreen();
    expect(view.getByRole('button', { name: 'اعرض صفحة التعريف التالية' })).toBeOnTheScreen();
    expect(view.queryByRole('button', { name: 'تسجيل الدخول' })).not.toBeOnTheScreen();
    expect(view.getByText('Hakeemi')).toBeOnTheScreen();
  });
});
