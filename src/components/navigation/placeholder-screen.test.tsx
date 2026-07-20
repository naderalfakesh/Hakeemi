import { render } from '@testing-library/react-native';

import { AppLocaleProvider } from '@/localization/locale-provider';
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

  it('renders Arabic copy under the Arabic locale', async () => {
    const view = await render(
      <AppThemeProvider colorScheme="light">
        <AppLocaleProvider locale="ar">
          <PlaceholderScreen description="وصف مفيد للشاشة" title="ابحث عن رعاية" />
        </AppLocaleProvider>
      </AppThemeProvider>,
    );

    expect(view.getByRole('header', { name: 'ابحث عن رعاية' })).toBeOnTheScreen();
    expect(view.getByText('وصف مفيد للشاشة')).toBeOnTheScreen();
  });
});
