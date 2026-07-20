import { render } from '@testing-library/react-native';
import type { ReactElement } from 'react';

import { AppLocaleProvider } from '@/localization/locale-provider';
import { TestAppProviders } from '@/test/test-app-providers';

import { StaleDataNotice } from './stale-data-notice';

function renderWithLocale(element: ReactElement, locale: 'ar' | 'en') {
  return render(
    <TestAppProviders>
      <AppLocaleProvider locale={locale}>{element}</AppLocaleProvider>
    </TestAppProviders>,
  );
}

describe('StaleDataNotice', () => {
  it('describes offline cached results with the last update time', async () => {
    const view = await renderWithLocale(
      <StaleDataNotice reason="offline" updatedAt={new Date('2026-07-20T09:30:00Z').getTime()} />,
      'en',
    );

    expect(view.getByText(/Offline — showing saved results\. Updated /)).toBeOnTheScreen();
  });

  it('describes a failed refresh without an update time', async () => {
    const view = await renderWithLocale(<StaleDataNotice reason="refresh-failed" />, 'en');

    expect(view.getByText('Latest refresh failed — showing earlier results.')).toBeOnTheScreen();
  });

  it('renders Arabic copy under the Arabic locale', async () => {
    const view = await renderWithLocale(<StaleDataNotice reason="offline" />, 'ar');

    expect(view.getByText('أنت غير متصل بالإنترنت — تُعرض نتائج محفوظة.')).toBeOnTheScreen();
  });
});
