import { fireEvent, render } from '@testing-library/react-native';

import { AppThemeProvider } from '@/theme';

import { DemoEntryScreen } from './demo-entry-screen';

describe('DemoEntryScreen', () => {
  it('explains the portfolio context and enters the demo', async () => {
    const onContinue = jest.fn();
    const view = await render(
      <AppThemeProvider colorScheme="light">
        <DemoEntryScreen onContinue={onContinue} />
      </AppThemeProvider>,
    );

    expect(view.getByRole('header', { name: 'Care, without the runaround.' })).toBeOnTheScreen();
    expect(view.getByText(/No real clinicians/iu)).toBeOnTheScreen();

    fireEvent.press(view.getByRole('button', { name: 'Explore the Hakeemi portfolio demo' }));

    expect(onContinue).toHaveBeenCalledTimes(1);
  });
});
