export type AuthUser = {
  displayName: string | null;
  email: string | null;
  emailVerified: boolean;
  id: string;
};

export type SignInInput = {
  email: string;
  password: string;
};

export type SignUpInput = SignInInput & {
  displayName: string;
};

export type AuthFailureCode =
  'account-exists' | 'invalid-credentials' | 'network' | 'rate-limited' | 'unavailable' | 'unknown';

export class AuthActionError extends Error {
  constructor(
    public readonly code: AuthFailureCode,
    message: string,
  ) {
    super(message);
    this.name = 'AuthActionError';
  }
}
