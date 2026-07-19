import { fireEvent, render } from '@testing-library/react-native';
import type { ReactElement } from 'react';

import { AppThemeProvider } from '@/theme';

import { Button } from './button';
import { Chip } from './chip';
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

    fireEvent.press(view.getByRole('button', { name: 'Continue' }));
    fireEvent.press(view.getByRole('button', { name: 'Unavailable' }));

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
});
