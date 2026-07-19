import { fireEvent, render, waitFor } from '@testing-library/react-native';

import { AppThemeProvider } from '@/theme';

import { ForgotPasswordScreen } from './forgot-password-screen';
import { SignInScreen } from './sign-in-screen';
import { SignUpScreen } from './sign-up-screen';
import { VerifyEmailScreen } from './verify-email-screen';

const noop = jest.fn();

describe('authentication screens', () => {
  beforeEach(() => {
    noop.mockReset();
  });

  it('validates and submits normalized sign-in credentials', async () => {
    const onSubmit = jest.fn().mockResolvedValue(undefined);
    const view = await render(
      <AppThemeProvider colorScheme="light">
        <SignInScreen
          onBack={noop}
          onContinueAsGuest={noop}
          onCreateAccount={noop}
          onForgotPassword={noop}
          onSubmit={onSubmit}
        />
      </AppThemeProvider>,
    );

    await fireEvent.press(view.getByRole('button', { name: 'Sign in' }));
    expect(await view.findByText('Enter your email address.')).toBeOnTheScreen();

    await fireEvent.changeText(view.getByLabelText('Email'), ' DEMO@EXAMPLE.COM ');
    await fireEvent.changeText(view.getByLabelText('Password'), 'password123');
    await fireEvent.press(view.getByRole('button', { name: 'Sign in' }));

    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith({
        email: 'demo@example.com',
        password: 'password123',
      }),
    );
  });

  it('keeps mismatched passwords at the field boundary', async () => {
    const onSubmit = jest.fn().mockResolvedValue(undefined);
    const view = await render(
      <AppThemeProvider colorScheme="light">
        <SignUpScreen onBack={noop} onSignIn={noop} onSubmit={onSubmit} />
      </AppThemeProvider>,
    );

    await fireEvent.changeText(view.getByLabelText('Name'), 'Demo Patient');
    await fireEvent.changeText(view.getByLabelText('Email'), 'demo@example.com');
    await fireEvent.changeText(view.getByLabelText('Password'), 'password123');
    await fireEvent.changeText(view.getByLabelText('Confirm password'), 'different123');
    await fireEvent.press(view.getByRole('button', { name: 'Create account' }));

    expect(await view.findByText('Passwords do not match.')).toBeOnTheScreen();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('uses a neutral password reset confirmation', async () => {
    const onSubmit = jest.fn().mockResolvedValue(undefined);
    const view = await render(
      <AppThemeProvider colorScheme="light">
        <ForgotPasswordScreen onBack={noop} onBackToSignIn={noop} onSubmit={onSubmit} />
      </AppThemeProvider>,
    );

    await fireEvent.changeText(view.getByLabelText('Email'), 'demo@example.com');
    await fireEvent.press(view.getByRole('button', { name: 'Send reset instructions' }));

    expect(await view.findByRole('header', { name: 'Check your inbox' })).toBeOnTheScreen();
    expect(view.getByText(/If an account exists/iu)).toBeOnTheScreen();
  });

  it('confirms when another verification email is sent', async () => {
    const onResend = jest.fn().mockResolvedValue(undefined);
    const view = await render(
      <AppThemeProvider colorScheme="light">
        <VerifyEmailScreen
          email="demo@example.com"
          onBack={noop}
          onContinue={noop}
          onResend={onResend}
          onUseAnotherAccount={noop}
        />
      </AppThemeProvider>,
    );

    await fireEvent.press(view.getByRole('button', { name: 'Resend email' }));

    expect(await view.findByText('A fresh verification email was sent.')).toBeOnTheScreen();
  });
});
