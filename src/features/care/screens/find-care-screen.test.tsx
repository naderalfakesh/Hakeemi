import { fireEvent, render, waitFor } from '@testing-library/react-native';

import { AppLocaleProvider } from '@/localization/locale-provider';
import { TestAppProviders } from '@/test/test-app-providers';

import { fixtureCareRepository } from '../data/fixture-care-repository';
import type { CareRepository } from '../domain/repository';
import { FindCareScreen } from './find-care-screen';

describe('FindCareScreen', () => {
  it('searches fictional clinicians by language', async () => {
    const view = await render(
      <TestAppProviders colorScheme="light">
        <FindCareScreen onSelectProvider={jest.fn()} repository={fixtureCareRepository} />
      </TestAppProviders>,
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
      <TestAppProviders colorScheme="dark">
        <FindCareScreen onSelectProvider={onSelectProvider} repository={fixtureCareRepository} />
      </TestAppProviders>,
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
      listProviderPage: jest
        .fn()
        .mockRejectedValueOnce(new Error('offline'))
        .mockResolvedValue({ items: [], nextCursor: null }),
      listSpecialties: jest.fn().mockResolvedValue([]),
    };
    const view = await render(
      <TestAppProviders colorScheme="light">
        <FindCareScreen onSelectProvider={jest.fn()} repository={repository} />
      </TestAppProviders>,
    );

    await waitFor(() =>
      expect(view.getByRole('header', { name: 'Clinicians could not be loaded' })).toBeVisible(),
    );
    await fireEvent.press(view.getByRole('button', { name: 'Try again' }));

    await waitFor(() =>
      expect(view.getByRole('header', { name: 'No clinicians match' })).toBeVisible(),
    );
  });

  it('renders Arabic copy when the app locale is Arabic', async () => {
    const view = await render(
      <TestAppProviders colorScheme="light">
        <AppLocaleProvider locale="ar">
          <FindCareScreen onSelectProvider={jest.fn()} repository={fixtureCareRepository} />
        </AppLocaleProvider>
      </TestAppProviders>,
    );

    await waitFor(() =>
      expect(
        view.getByRole('button', { name: 'عرض الملف الشخصي للطبيب Dr. Lina Haddad' }),
      ).toBeVisible(),
    );

    expect(view.getByRole('header', { name: 'ابحث عن رعاية' })).toBeVisible();
    expect(view.getByLabelText('البحث عن الأطباء')).toBeOnTheScreen();
    expect(view.getByRole('button', { name: 'طب القلب' })).toBeVisible();
  });

  it('shows an offline notice above cached results', async () => {
    const network = jest.requireMock('expo-network') as {
      useNetworkState: jest.Mock;
    };
    network.useNetworkState.mockReturnValue({ isConnected: false, isInternetReachable: false });

    try {
      const view = await render(
        <TestAppProviders colorScheme="light">
          <FindCareScreen onSelectProvider={jest.fn()} repository={fixtureCareRepository} />
        </TestAppProviders>,
      );

      await waitFor(() =>
        expect(
          view.getByRole('button', { name: 'View profile for Dr. Lina Haddad' }),
        ).toBeVisible(),
      );

      expect(view.getByText(/Offline — showing saved results\./)).toBeOnTheScreen();
    } finally {
      network.useNetworkState.mockReturnValue({ isConnected: true, isInternetReachable: true });
    }
  });
});
