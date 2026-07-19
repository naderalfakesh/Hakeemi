import { AuthActionError } from './types';

const AUTH_ERROR_MESSAGES = {
  'account-exists': 'An account already uses this email. Try signing in instead.',
  'invalid-credentials': 'The email or password is incorrect. Check both and try again.',
  network: 'Hakeemi could not reach the service. Check your connection and try again.',
  'rate-limited': 'Too many attempts were made. Wait a moment, then try again.',
  unavailable: 'Account access is available in the iOS and Android portfolio builds.',
  unknown: 'Something went wrong while accessing your account. Please try again.',
} as const;

export function toAuthActionError(error: unknown): AuthActionError {
  if (error instanceof AuthActionError) {
    return error;
  }

  const code = getErrorCode(error);

  if (code === 'auth/email-already-in-use') {
    return new AuthActionError('account-exists', AUTH_ERROR_MESSAGES['account-exists']);
  }

  if (
    code === 'auth/invalid-credential' ||
    code === 'auth/invalid-email' ||
    code === 'auth/user-not-found' ||
    code === 'auth/wrong-password'
  ) {
    return new AuthActionError('invalid-credentials', AUTH_ERROR_MESSAGES['invalid-credentials']);
  }

  if (code === 'auth/network-request-failed') {
    return new AuthActionError('network', AUTH_ERROR_MESSAGES.network);
  }

  if (code === 'auth/too-many-requests') {
    return new AuthActionError('rate-limited', AUTH_ERROR_MESSAGES['rate-limited']);
  }

  return new AuthActionError('unknown', AUTH_ERROR_MESSAGES.unknown);
}

export function createAuthUnavailableError() {
  return new AuthActionError('unavailable', AUTH_ERROR_MESSAGES.unavailable);
}

function getErrorCode(error: unknown) {
  if (typeof error !== 'object' || error === null || !('code' in error)) {
    return undefined;
  }

  return typeof error.code === 'string' ? error.code : undefined;
}
