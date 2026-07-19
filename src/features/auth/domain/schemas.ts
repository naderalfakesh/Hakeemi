import { z } from 'zod';

const emailSchema = z
  .string()
  .trim()
  .min(1, 'Enter your email address.')
  .email('Enter a valid email address.')
  .toLowerCase();

const passwordSchema = z.string().min(1, 'Enter your password.');
const newPasswordSchema = passwordSchema.min(8, 'Use at least 8 characters.');

export const signInSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

export const signUpSchema = z
  .object({
    confirmPassword: z.string().min(1, 'Confirm your password.'),
    displayName: z
      .string()
      .trim()
      .min(2, 'Enter at least 2 characters.')
      .max(80, 'Keep your name under 80 characters.'),
    email: emailSchema,
    password: newPasswordSchema,
  })
  .refine(({ confirmPassword, password }) => confirmPassword === password, {
    message: 'Passwords do not match.',
    path: ['confirmPassword'],
  });

export const passwordResetSchema = z.object({ email: emailSchema });

export type PasswordResetValues = z.infer<typeof passwordResetSchema>;
export type SignInValues = z.infer<typeof signInSchema>;
export type SignUpValues = z.infer<typeof signUpSchema>;
