import { render } from '@testing-library/react-native';
import { Appearance, Text } from 'react-native';

import { AppThemeProvider, useAppTheme } from './theme-provider';

function ThemeProbe() {
  const theme = useAppTheme();
  return <Text>{theme.mode}</Text>;
}

describe('AppThemeProvider', () => {
  it('honors an account theme preference over the system scheme', async () => {
    const view = await render(
      <AppThemeProvider preference="dark">
        <ThemeProbe />
      </AppThemeProvider>,
    );

    expect(view.getByText('dark')).toBeOnTheScreen();
  });

  it('keeps an explicit test color scheme deterministic', async () => {
    const view = await render(
      <AppThemeProvider colorScheme="light" preference="dark">
        <ThemeProbe />
      </AppThemeProvider>,
    );

    expect(view.getByText('light')).toBeOnTheScreen();
  });

  it('applies an explicit preference to the native appearance and releases it for system', async () => {
    const setColorScheme = jest.spyOn(Appearance, 'setColorScheme').mockImplementation(() => {});

    const view = await render(
      <AppThemeProvider preference="dark">
        <ThemeProbe />
      </AppThemeProvider>,
    );
    expect(setColorScheme).toHaveBeenLastCalledWith('dark');

    await view.rerender(
      <AppThemeProvider preference="system">
        <ThemeProbe />
      </AppThemeProvider>,
    );
    expect(setColorScheme).toHaveBeenLastCalledWith('auto');

    setColorScheme.mockRestore();
  });
});
