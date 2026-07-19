import { fireEvent, render } from '@testing-library/react-native';
import type { ReactElement } from 'react';

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
