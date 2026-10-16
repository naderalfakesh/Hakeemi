import { render } from '@testing-library/react-native';

import { AppThemeProvider } from '@/theme';

import { LaunchGate } from './launch-gate';

describe('LaunchGate', () => {
  it('shows only the brand mark while the entry route resolves', async () => {
    const view = await render(
      <AppThemeProvider colorScheme="light">
        <LaunchGate />
      </AppThemeProvider>,
    );

    expect(view.getByTestId('brand-mark', { includeHiddenElements: true })).toBeOnTheScreen();
    expect(view.queryByLabelText(/session/iu)).not.toBeOnTheScreen();
  });

  it('announces the session status when restoring takes longer', async () => {
    const view = await render(
      <AppThemeProvider colorScheme="dark">
        <LaunchGate accessibilityLabel="Restoring your session" message="Restoring your session…" />
      </AppThemeProvider>,
    );

    expect(view.getByLabelText('Restoring your session')).toBeOnTheScreen();
    expect(view.getByText('Restoring your session…')).toBeOnTheScreen();
  });
});
