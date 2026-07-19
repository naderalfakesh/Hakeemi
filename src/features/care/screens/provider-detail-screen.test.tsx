import { fireEvent, render, waitFor } from '@testing-library/react-native';

import { AppThemeProvider } from '@/theme';

import { fixtureCareRepository } from '../data/fixture-care-repository';
import type { CareRepository } from '../domain/repository';
import { ProviderDetailScreen } from './provider-detail-screen';

describe('ProviderDetailScreen', () => {
  it('shows decision-making details from the fictional repository', async () => {
    const view = await render(
      <AppThemeProvider colorScheme="light">
        <ProviderDetailScreen
          onBack={jest.fn()}
          providerId="lina-haddad"
          repository={fixtureCareRepository}
        />
      </AppThemeProvider>,
    );

    await waitFor(() =>
      expect(view.getByRole('header', { name: 'Dr. Lina Haddad' })).toBeVisible(),
    );

    expect(view.getByText('Marsa Family Clinic')).toBeOnTheScreen();
    expect(view.getByText(/AED\s*340/iu)).toBeOnTheScreen();
    expect(view.getByText(/Times shown in Gulf Standard Time/iu)).toBeOnTheScreen();
  });

  it('provides a safe way back when a provider is missing', async () => {
    const onBack = jest.fn();
    const view = await render(
      <AppThemeProvider colorScheme="dark">
        <ProviderDetailScreen
          onBack={onBack}
          providerId="missing-provider"
          repository={fixtureCareRepository}
        />
      </AppThemeProvider>,
    );

    const browseButton = await waitFor(() =>
      view.getByRole('button', { name: 'Browse clinicians' }),
    );
    await fireEvent.press(browseButton);

    expect(view.getByRole('header', { name: 'Provider not found' })).toBeVisible();
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it('retries a failed profile request', async () => {
    const repository: CareRepository = {
      getClinic: jest.fn().mockResolvedValue(null),
      getProvider: jest.fn().mockRejectedValueOnce(new Error('offline')).mockResolvedValue(null),
      listAvailableSlots: jest.fn().mockResolvedValue([]),
      listClinics: jest.fn().mockResolvedValue([]),
      listProviders: jest.fn().mockResolvedValue([]),
      listSpecialties: jest.fn().mockResolvedValue([]),
    };
    const view = await render(
      <AppThemeProvider colorScheme="light">
        <ProviderDetailScreen onBack={jest.fn()} providerId="lina-haddad" repository={repository} />
      </AppThemeProvider>,
    );

    const retryButton = await waitFor(() => view.getByRole('button', { name: 'Try again' }));
    await fireEvent.press(retryButton);

    await waitFor(() =>
      expect(view.getByRole('header', { name: 'Provider not found' })).toBeVisible(),
    );
  });
});
