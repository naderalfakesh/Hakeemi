import { fireEvent, render, waitFor } from '@testing-library/react-native';

import { AppThemeProvider } from '@/theme';

import { fixtureCareRepository } from '../data/fixture-care-repository';
import type { CareRepository } from '../domain/repository';
import { FindCareScreen } from './find-care-screen';

describe('FindCareScreen', () => {
  it('searches fictional clinicians by language', async () => {
    const view = await render(
      <AppThemeProvider colorScheme="light">
        <FindCareScreen onSelectProvider={jest.fn()} repository={fixtureCareRepository} />
      </AppThemeProvider>,
    );

    await waitFor(() =>
      expect(view.getByRole('button', { name: 'View profile for Dr. Lina Haddad' })).toBeVisible(),
    );

    await fireEvent.changeText(view.getByLabelText('Search clinicians'), 'Malayalam');

    await waitFor(() => {
      expect(view.getByRole('button', { name: 'View profile for Dr. Priya Menon' })).toBeVisible();
      expect(
        view.queryByRole('button', { name: 'View profile for Dr. Lina Haddad' }),
      ).not.toBeOnTheScreen();
    });
  });

  it('filters by specialty and opens a provider', async () => {
    const onSelectProvider = jest.fn();
    const view = await render(
      <AppThemeProvider colorScheme="dark">
        <FindCareScreen onSelectProvider={onSelectProvider} repository={fixtureCareRepository} />
      </AppThemeProvider>,
    );

    await waitFor(() => expect(view.getByRole('button', { name: 'Cardiology' })).toBeVisible());
    await fireEvent.press(view.getByRole('button', { name: 'Cardiology' }));

    const provider = await waitFor(() =>
      view.getByRole('button', { name: 'View profile for Dr. Omar Rahman' }),
    );
    await fireEvent.press(provider);

    expect(onSelectProvider).toHaveBeenCalledWith('omar-rahman');
  });

  it('recovers from a repository error', async () => {
    const repository: CareRepository = {
      getClinic: jest.fn().mockResolvedValue(null),
      getProvider: jest.fn().mockResolvedValue(null),
      listAvailableSlots: jest.fn().mockResolvedValue([]),
      listClinics: jest.fn().mockResolvedValue([]),
      listProviders: jest.fn().mockRejectedValueOnce(new Error('offline')).mockResolvedValue([]),
      listSpecialties: jest.fn().mockResolvedValue([]),
    };
    const view = await render(
      <AppThemeProvider colorScheme="light">
        <FindCareScreen onSelectProvider={jest.fn()} repository={repository} />
      </AppThemeProvider>,
    );

    await waitFor(() =>
      expect(view.getByRole('header', { name: 'Clinicians could not be loaded' })).toBeVisible(),
    );
    await fireEvent.press(view.getByRole('button', { name: 'Try again' }));

    await waitFor(() =>
      expect(view.getByRole('header', { name: 'No clinicians match' })).toBeVisible(),
    );
  });
});
