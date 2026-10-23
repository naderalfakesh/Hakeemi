import { fireEvent, render } from '@testing-library/react-native';
import type { ReactElement } from 'react';

import { AppLocaleProvider } from '@/localization/locale-provider';
import { AppThemeProvider } from '@/theme';

import { Button } from './button';
import { Chip } from './chip';
import { DecorativeIcon } from './decorative-icon';
import { TextField } from './text-field';

function renderWithTheme(element: ReactElement) {
  return render(<AppThemeProvider colorScheme="light">{element}</AppThemeProvider>);
}

describe('interactive primitives', () => {
  it('calls a button action and exposes its disabled state', async () => {
    const onPress = jest.fn();
    const view = await renderWithTheme(
      <>
        <Button onPress={onPress}>Continue</Button>
        <Button disabled onPress={onPress}>
          Unavailable
        </Button>
      </>,
    );

    await fireEvent.press(view.getByRole('button', { name: 'Continue' }));
    await fireEvent.press(view.getByRole('button', { name: 'Unavailable' }));

    expect(onPress).toHaveBeenCalledTimes(1);
    expect(view.getByRole('button', { name: 'Unavailable' })).toBeDisabled();
  });

  it('announces chip selection', async () => {
    const view = await renderWithTheme(<Chip label="Available today" selected />);

    expect(view.getByRole('button', { name: 'Available today' })).toBeSelected();
  });

  it('drops letter spacing from Arabic chip labels so they are not clipped', async () => {
    const english = await renderWithTheme(<Chip label="Use device" />);
    expect(english.getByText('Use device')).toHaveStyle({ letterSpacing: 0.1 });

    const arabic = await renderWithTheme(
      <AppLocaleProvider locale="ar">
        <Chip label="حسب الجهاز" />
      </AppLocaleProvider>,
    );
    expect(arabic.getByText('حسب الجهاز')).toHaveStyle({ flexShrink: 1, letterSpacing: 0 });
  });

  it('associates a field with its label and renders validation feedback', async () => {
    const view = await renderWithTheme(
      <TextField error="Enter a valid email address" label="Email address" value="nader@" />,
    );

    expect(view.getByLabelText('Email address')).toHaveProp('aria-invalid', true);
    expect(view.getByText('Enter a valid email address')).toBeOnTheScreen();
  });

  it('keeps decorative icons out of the accessibility tree', async () => {
    const view = await renderWithTheme(
      <DecorativeIcon color="#000" name="star" size={18} testID="decorative-icon" />,
    );
    expect(view.queryByTestId('decorative-icon')).toBeNull();
    const icon = view.getByTestId('decorative-icon', { includeHiddenElements: true });

    expect(icon).toHaveProp('accessibilityElementsHidden', true);
    expect(icon).toHaveProp('importantForAccessibility', 'no');
  });
});
