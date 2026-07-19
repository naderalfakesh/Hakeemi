import { fireEvent, render, waitFor } from '@testing-library/react-native';

import { fixtureCareRepository } from '@/features/care/data/fixture-care-repository';
import { TestAppProviders } from '@/test/test-app-providers';

import { HomeScreen } from './home-screen';

describe('HomeScreen', () => {
  it('surfaces fixture-backed recommendations and opens a provider', async () => {
    const onSelectProvider = jest.fn();
    const view = await render(
      <TestAppProviders colorScheme="dark">
        <HomeScreen
          onFindCare={jest.fn()}
          onSelectProvider={onSelectProvider}
          repository={fixtureCareRepository}
        />
      </TestAppProviders>,
    );

    const provider = await waitFor(() =>
      view.getByRole('button', { name: 'View profile for Dr. Lina Haddad' }),
    );
    await fireEvent.press(provider);

    expect(view.getByRole('header', { name: 'What would help today?' })).toBeVisible();
    expect(onSelectProvider).toHaveBeenCalledWith('lina-haddad');
  });
});
