import { createAuthUnavailableError } from '../domain/errors';
import type { SignInInput, SignUpInput } from '../domain/types';

export function observeAuthState(listener: (user: null) => void) {
  listener(null);
  return () => undefined;
}

export async function getCurrentAuthUser(): Promise<null> {
  return null;
}

export async function signIn(_input: SignInInput): Promise<never> {
  throw createAuthUnavailableError();
}

export async function signUp(_input: SignUpInput): Promise<never> {
  throw createAuthUnavailableError();
}

export async function requestPasswordReset(_email: string): Promise<never> {
  throw createAuthUnavailableError();
}

export async function resendVerificationEmail(): Promise<never> {
  throw createAuthUnavailableError();
}

export async function signOut(): Promise<void> {}
