import { localizeAuthError } from '../localization/auth-error-strings';
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

  it('localizes normalized failures per locale', () => {
    expect(localizeAuthError({ code: 'auth/network-request-failed' }, 'en')).toBe(
      'Hakeemi could not reach the service. Check your connection and try again.',
    );
    expect(localizeAuthError({ code: 'auth/network-request-failed' }, 'ar')).toBe(
      'تعذّر على «حكيمي» الوصول إلى الخدمة. تحقق من اتصالك وحاول مرة أخرى.',
    );
    expect(localizeAuthError(createAuthUnavailableError(), 'ar')).toBe(
      'الوصول إلى الحساب متاح في نسختي iOS وAndroid من معرض الأعمال.',
    );
  });
});
