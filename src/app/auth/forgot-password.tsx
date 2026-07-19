import { Redirect, router } from 'expo-router';

import { useAuthSession } from '@/features/auth/context/auth-session-provider';
import { requestPasswordReset } from '@/features/auth/data/firebase-auth';
import type { PasswordResetValues } from '@/features/auth/domain/schemas';
import { ForgotPasswordScreen } from '@/features/auth/screens/forgot-password-screen';

export default function ForgotPasswordRoute() {
  const session = useAuthSession();

  if (session.status === 'authenticated') {
    return <Redirect href={session.user?.emailVerified ? '/home' : '/auth/verify-email'} />;
  }

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
