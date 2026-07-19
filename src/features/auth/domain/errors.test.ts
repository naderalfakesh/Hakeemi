import { AuthActionError } from './types';
import { createAuthUnavailableError, toAuthActionError } from './errors';

describe('authentication errors', () => {
  it('does not reveal whether an invalid credential belongs to an account', () => {
    expect(toAuthActionError({ code: 'auth/user-not-found' })).toMatchObject({
      code: 'invalid-credentials',
      message: 'The email or password is incorrect. Check both and try again.',
    });
  });

  it('preserves a normalized authentication failure', () => {
    const error = new AuthActionError('network', 'Try again.');

    expect(toAuthActionError(error)).toBe(error);
  });

  it('describes the native-only account boundary on web', () => {
    expect(createAuthUnavailableError()).toMatchObject({
      code: 'unavailable',
      message: expect.stringContaining('iOS and Android'),
    });
  });
});
