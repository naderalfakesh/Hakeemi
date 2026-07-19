import { render } from '@testing-library/react-native';
import { Text } from 'react-native';

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
});
