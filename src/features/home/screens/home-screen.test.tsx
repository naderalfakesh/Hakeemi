import { fireEvent, render, waitFor } from '@testing-library/react-native';

import { fixtureCareRepository } from '@/features/care/data/fixture-care-repository';
import { AppLocaleProvider } from '@/localization/locale-provider';
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

  it('renders Arabic copy when the app locale is Arabic', async () => {
    const view = await render(
      <TestAppProviders colorScheme="light">
        <AppLocaleProvider locale="ar">
          <HomeScreen
            onFindCare={jest.fn()}
            onSelectProvider={jest.fn()}
            repository={fixtureCareRepository}
          />
        </AppLocaleProvider>
      </TestAppProviders>,
    );

    await waitFor(() =>
      expect(
        view.getByRole('button', { name: 'عرض الملف الشخصي للطبيب د. لينا حداد' }),
      ).toBeVisible(),
    );

    expect(view.getByRole('header', { name: 'كيف يمكننا مساعدتك اليوم؟' })).toBeVisible();
    expect(view.getAllByText('طب الأسرة').length).toBeGreaterThan(0);
  });
});
