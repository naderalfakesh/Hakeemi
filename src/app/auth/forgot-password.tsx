import { router } from 'expo-router';

import { requestPasswordReset } from '@/features/auth/data/firebase-auth';
import type { PasswordResetValues } from '@/features/auth/domain/schemas';
import { ForgotPasswordScreen } from '@/features/auth/screens/forgot-password-screen';

export default function ForgotPasswordRoute() {
  async function handleSubmit(values: PasswordResetValues) {
    await requestPasswordReset(values.email);
  }

  return (
    <ForgotPasswordScreen
      onBack={() => (router.canGoBack() ? router.back() : router.replace('/auth/sign-in'))}
      onBackToSignIn={() => router.replace('/auth/sign-in')}
      onSubmit={handleSubmit}
    />
  );
}
