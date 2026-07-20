import { resolveStrings } from '@/localization/use-strings';

import { authValidationStrings } from '../localization/auth-validation-strings';
import { createPasswordResetSchema, createSignInSchema, createSignUpSchema } from './schemas';

const englishMessages = resolveStrings(authValidationStrings, 'en');
const arabicMessages = resolveStrings(authValidationStrings, 'ar');

describe('authentication schemas', () => {
  it('normalizes a valid sign-in email', () => {
    expect(
      createSignInSchema(englishMessages).parse({
        email: '  DEMO@EXAMPLE.COM ',
        password: 'password123',
      }),
    ).toEqual({
      email: 'demo@example.com',
      password: 'password123',
    });
  });

  it('requires matching sign-up passwords', () => {
    const result = createSignUpSchema(englishMessages).safeParse({
      confirmPassword: 'different123',
      displayName: 'Demo Patient',
      email: 'demo@example.com',
      password: 'password123',
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0]).toMatchObject({
      message: 'Passwords do not match.',
      path: ['confirmPassword'],
    });
  });

  it('rejects malformed recovery addresses', () => {
    expect(
      createPasswordResetSchema(englishMessages).safeParse({ email: 'not-an-email' }).success,
    ).toBe(false);
  });

  it('reports validation failures in Arabic when built with Arabic messages', () => {
    const result = createSignInSchema(arabicMessages).safeParse({
      email: '',
      password: 'password123',
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe('أدخل عنوان بريدك الإلكتروني.');
  });
});
