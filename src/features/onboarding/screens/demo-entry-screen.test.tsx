import { fireEvent, render } from '@testing-library/react-native';

import { AppLocaleProvider } from '@/localization/locale-provider';
import { AppThemeProvider } from '@/theme';

import { DemoEntryScreen } from './demo-entry-screen';

describe('DemoEntryScreen', () => {
  it('explains the portfolio context and enters the demo', async () => {
    const onContinue = jest.fn();
    const onSignIn = jest.fn();
    const view = await render(
      <AppThemeProvider colorScheme="light">
        <DemoEntryScreen onContinue={onContinue} onSignIn={onSignIn} />
      </AppThemeProvider>,
    );

    expect(view.getByRole('header', { name: 'Care, without the runaround.' })).toBeOnTheScreen();
    expect(view.getByText(/No real clinicians/iu)).toBeOnTheScreen();

    await fireEvent.press(view.getByRole('button', { name: 'Explore the Hakeemi portfolio demo' }));

    expect(onContinue).toHaveBeenCalledTimes(1);

    await fireEvent.press(view.getByRole('button', { name: 'Sign in' }));

    expect(onSignIn).toHaveBeenCalledTimes(1);
  });

  it('renders the entry copy in Arabic', async () => {
    const view = await render(
      <AppThemeProvider colorScheme="light">
        <AppLocaleProvider locale="ar">
          <DemoEntryScreen onContinue={jest.fn()} onSignIn={jest.fn()} />
        </AppLocaleProvider>
      </AppThemeProvider>,
    );

    expect(view.getByRole('header', { name: 'رعاية صحية، من دون تعقيدات.' })).toBeOnTheScreen();
    expect(
      view.getByRole('button', { name: 'استكشف العرض التجريبي لتطبيق حكيمي' }),
    ).toBeOnTheScreen();
    expect(view.getByRole('button', { name: 'تسجيل الدخول' })).toBeOnTheScreen();
    expect(view.getByText('Hakeemi')).toBeOnTheScreen();
  });
});
