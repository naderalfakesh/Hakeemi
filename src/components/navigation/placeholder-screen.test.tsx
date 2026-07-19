import { render } from '@testing-library/react-native';

import { PlaceholderScreen } from './placeholder-screen';

describe('PlaceholderScreen', () => {
  it('exposes its title as a heading and renders the description', async () => {
    const view = await render(
      <PlaceholderScreen description="A helpful description" title="Find care" />,
    );

    expect(view.getByRole('header', { name: 'Find care' })).toBeOnTheScreen();
    expect(view.getByText('A helpful description')).toBeOnTheScreen();
  });
});
