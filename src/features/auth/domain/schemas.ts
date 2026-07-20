import { z } from 'zod';

export type AuthValidationMessages = {
  confirmPasswordRequired: string;
  emailInvalid: string;
  emailRequired: string;
  nameMaxLength: string;
  nameMinLength: string;
  passwordMinLength: string;
  passwordRequired: string;
  passwordsDoNotMatch: string;
};

function createEmailSchema(messages: AuthValidationMessages) {
  return z
    .string()
    .trim()
    .min(1, messages.emailRequired)
    .email(messages.emailInvalid)
    .toLowerCase();
}

function createPasswordSchema(messages: AuthValidationMessages) {
  return z.string().min(1, messages.passwordRequired);
}

export function createSignInSchema(messages: AuthValidationMessages) {
  return z.object({
    email: createEmailSchema(messages),
    password: createPasswordSchema(messages),
  });
}

export function createSignUpSchema(messages: AuthValidationMessages) {
  return z
    .object({
      confirmPassword: z.string().min(1, messages.confirmPasswordRequired),
      displayName: z.string().trim().min(2, messages.nameMinLength).max(80, messages.nameMaxLength),
      email: createEmailSchema(messages),
      password: createPasswordSchema(messages).min(8, messages.passwordMinLength),
    })
    .refine(({ confirmPassword, password }) => confirmPassword === password, {
      message: messages.passwordsDoNotMatch,
      path: ['confirmPassword'],
    });
}

export function createPasswordResetSchema(messages: AuthValidationMessages) {
  return z.object({ email: createEmailSchema(messages) });
}

export type PasswordResetValues = z.infer<ReturnType<typeof createPasswordResetSchema>>;
export type SignInValues = z.infer<ReturnType<typeof createSignInSchema>>;
export type SignUpValues = z.infer<ReturnType<typeof createSignUpSchema>>;
