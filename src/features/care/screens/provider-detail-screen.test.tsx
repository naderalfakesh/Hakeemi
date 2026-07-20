import { fireEvent, render, waitFor } from '@testing-library/react-native';

import { AppLocaleProvider } from '@/localization/locale-provider';
import { TestAppProviders } from '@/test/test-app-providers';

import { fixtureCareRepository } from '../data/fixture-care-repository';
import type { CareRepository } from '../domain/repository';
import { ProviderDetailScreen } from './provider-detail-screen';

describe('ProviderDetailScreen', () => {
  it('shows decision-making details from the fictional repository', async () => {
    const onChooseSlot = jest.fn();
    const view = await render(
      <TestAppProviders colorScheme="light">
        <ProviderDetailScreen
          onBack={jest.fn()}
          onChooseSlot={onChooseSlot}
          providerId="lina-haddad"
          repository={fixtureCareRepository}
        />
      </TestAppProviders>,
    );

    await waitFor(() =>
      expect(view.getByRole('header', { name: 'Dr. Lina Haddad' })).toBeVisible(),
    );

    expect(view.getByText('Marsa Family Clinic')).toBeOnTheScreen();
    expect(view.getByText(/AED\s*340/iu)).toBeOnTheScreen();
    expect(view.getByText(/Times are shown in Gulf Standard Time/iu)).toBeOnTheScreen();
    expect(view.getByLabelText('2 available appointments')).toBeOnTheScreen();

    await fireEvent.press(view.getAllByRole('button', { name: /Choose /u })[0]!);
    expect(onChooseSlot).toHaveBeenCalledWith(
      expect.objectContaining({ providerId: 'lina-haddad' }),
    );
  });

  it('exposes an accessible saved-provider toggle', async () => {
    const onToggleSavedProvider = jest.fn();
    const view = await render(
      <TestAppProviders colorScheme="light">
        <ProviderDetailScreen
          isProviderSaved={false}
          onBack={jest.fn()}
          onChooseSlot={jest.fn()}
          onToggleSavedProvider={onToggleSavedProvider}
          providerId="lina-haddad"
          repository={fixtureCareRepository}
          savedProviderStatus="ready"
        />
      </TestAppProviders>,
    );

    await waitFor(() =>
      expect(view.getByRole('header', { name: 'Dr. Lina Haddad' })).toBeVisible(),
    );
    await fireEvent.press(view.getByRole('button', { name: 'Save Dr. Lina Haddad' }));

    expect(onToggleSavedProvider).toHaveBeenCalledWith('lina-haddad');
  });

  it('provides a safe way back when a provider is missing', async () => {
    const onBack = jest.fn();
    const view = await render(
      <TestAppProviders colorScheme="dark">
        <ProviderDetailScreen
          onBack={onBack}
          onChooseSlot={jest.fn()}
          providerId="missing-provider"
          repository={fixtureCareRepository}
        />
      </TestAppProviders>,
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
      listProviderPage: jest.fn().mockResolvedValue({ items: [], nextCursor: null }),
      listSpecialties: jest.fn().mockResolvedValue([]),
    };
    const view = await render(
      <TestAppProviders colorScheme="light">
        <ProviderDetailScreen
          onBack={jest.fn()}
          onChooseSlot={jest.fn()}
          providerId="lina-haddad"
          repository={repository}
        />
      </TestAppProviders>,
    );

    const retryButton = await waitFor(() => view.getByRole('button', { name: 'Try again' }));
    await fireEvent.press(retryButton);

    await waitFor(() =>
      expect(view.getByRole('header', { name: 'Provider not found' })).toBeVisible(),
    );
  });

  it('renders Arabic copy when the app locale is Arabic', async () => {
    const view = await render(
      <TestAppProviders colorScheme="light">
        <AppLocaleProvider locale="ar">
          <ProviderDetailScreen
            onBack={jest.fn()}
            onChooseSlot={jest.fn()}
            providerId="lina-haddad"
            repository={fixtureCareRepository}
          />
        </AppLocaleProvider>
      </TestAppProviders>,
    );

    await waitFor(() =>
      expect(view.getByRole('header', { name: 'Dr. Lina Haddad' })).toBeVisible(),
    );

    expect(view.getByText('طب الأسرة')).toBeOnTheScreen();
    expect(view.getByText('المواعيد المتاحة')).toBeOnTheScreen();
    expect(view.getByText('الاستشارة')).toBeOnTheScreen();
    expect(view.getByLabelText('موعدان متاحان')).toBeOnTheScreen();
    expect(view.getByLabelText('حفظ Dr. Lina Haddad')).toBeOnTheScreen();
  });
});
