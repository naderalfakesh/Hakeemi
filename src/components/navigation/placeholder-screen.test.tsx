import { render } from '@testing-library/react-native';

import { AppThemeProvider } from '@/theme';

import { PlaceholderScreen } from './placeholder-screen';

describe('PlaceholderScreen', () => {
  it('exposes its title as a heading and renders the description', async () => {
    const view = await render(
      <AppThemeProvider colorScheme="light">
        <PlaceholderScreen description="A helpful description" title="Find care" />
      </AppThemeProvider>,
    );

    expect(view.getByRole('header', { name: 'Find care' })).toBeOnTheScreen();
    expect(view.getByText('A helpful description')).toBeOnTheScreen();
  });
});
