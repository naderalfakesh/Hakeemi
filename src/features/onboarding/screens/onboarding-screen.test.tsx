import { act, fireEvent, render } from '@testing-library/react-native';

import { AppLocaleProvider } from '@/localization/locale-provider';
import { AppThemeProvider } from '@/theme';

import { OnboardingScreen } from './onboarding-screen';

function renderOnboarding({
  locale = 'en',
  onComplete = jest.fn(),
  onSkip = jest.fn(),
}: {
  locale?: 'ar' | 'en';
  onComplete?: jest.Mock;
  onSkip?: jest.Mock;
} = {}) {
  return render(
    <AppThemeProvider colorScheme="light">
      <AppLocaleProvider locale={locale}>
        <OnboardingScreen onComplete={onComplete} onSkip={onSkip} />
      </AppLocaleProvider>
    </AppThemeProvider>,
  );
}

describe('OnboardingScreen', () => {
  it('moves through the three steps and completes from the last one', async () => {
    const onComplete = jest.fn();
    const view = await renderOnboarding({ onComplete });

    expect(view.getByRole('header', { name: 'Care, without the runaround.' })).toBeOnTheScreen();
    expect(view.getByText('Step 1 of 3')).toBeOnTheScreen();
    expect(view.queryByRole('button', { name: 'Sign in' })).not.toBeOnTheScreen();
    expect(view.queryByRole('button', { name: 'Create account' })).not.toBeOnTheScreen();
    expect(view.queryByText(/No real clinicians/iu)).not.toBeOnTheScreen();

    await fireEvent.press(view.getByRole('button', { name: 'Show the next onboarding page' }));

    expect(view.getByRole('header', { name: 'Find, compare, book.' })).toBeOnTheScreen();
    expect(view.getByText('Search clinicians by specialty or language.')).toBeOnTheScreen();

    await fireEvent.press(view.getByRole('button', { name: 'Back' }));

    expect(view.getByRole('header', { name: 'Care, without the runaround.' })).toBeOnTheScreen();

    await fireEvent.press(view.getByRole('button', { name: 'Show the next onboarding page' }));
    await fireEvent.press(view.getByRole('button', { name: 'Show the next onboarding page' }));

    expect(view.getByRole('header', { name: 'Permissions, only when needed.' })).toBeOnTheScreen();
    expect(view.getByText('Nothing is requested during setup.')).toBeOnTheScreen();
    expect(view.getByText('Step 3 of 3')).toBeOnTheScreen();
    expect(
      view.queryByRole('button', { name: 'Skip onboarding and continue to welcome' }),
    ).not.toBeOnTheScreen();

    await fireEvent.press(
      view.getByRole('button', { name: 'Finish onboarding and continue to welcome' }),
    );

    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it('can skip directly to welcome from the first step', async () => {
    const onSkip = jest.fn();
    const view = await renderOnboarding({ onSkip });

    await fireEvent.press(
      view.getByRole('button', { name: 'Skip onboarding and continue to welcome' }),
    );

    expect(onSkip).toHaveBeenCalledTimes(1);
  });

  it('starts on a welcome page that leaves language and appearance to the device', async () => {
    const view = await renderOnboarding();

    expect(view.getByRole('header', { name: 'Care, without the runaround.' })).toBeOnTheScreen();
    expect(view.queryByText(/follows your device/iu)).not.toBeOnTheScreen();
    expect(view.queryByRole('radio')).not.toBeOnTheScreen();
    expect(view.queryByText('Language')).not.toBeOnTheScreen();
    expect(view.queryByText('Appearance')).not.toBeOnTheScreen();
  });

  it('keeps progress and actions synchronized after a swipe', async () => {
    const view = await renderOnboarding();

    await act(async () => {
      view.getByTestId('onboarding-pages').props.onMomentumScrollEnd({
        nativeEvent: { contentOffset: { x: 10_000, y: 0 } },
      });
    });

    expect(view.getByRole('header', { name: 'Permissions, only when needed.' })).toBeOnTheScreen();
    expect(view.getByText('Step 3 of 3')).toBeOnTheScreen();
    expect(
      view.getByRole('button', { name: 'Finish onboarding and continue to welcome' }),
    ).toBeOnTheScreen();
  });

  it('renders the entry copy in Arabic', async () => {
    const view = await renderOnboarding({ locale: 'ar' });

    expect(view.getByRole('header', { name: 'رعاية صحية، من دون تعقيدات.' })).toBeOnTheScreen();
    expect(view.getByRole('button', { name: 'اعرض صفحة التعريف التالية' })).toBeOnTheScreen();
    expect(view.queryByRole('button', { name: 'تسجيل الدخول' })).not.toBeOnTheScreen();
    expect(view.getByText('Hakeemi')).toBeOnTheScreen();
  });
});
