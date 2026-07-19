import { passwordResetSchema, signInSchema, signUpSchema } from './schemas';

describe('authentication schemas', () => {
  it('normalizes a valid sign-in email', () => {
    expect(signInSchema.parse({ email: '  DEMO@EXAMPLE.COM ', password: 'password123' })).toEqual({
      email: 'demo@example.com',
      password: 'password123',
    });
  });

  it('requires matching sign-up passwords', () => {
    const result = signUpSchema.safeParse({
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
    expect(passwordResetSchema.safeParse({ email: 'not-an-email' }).success).toBe(false);
  });
});
