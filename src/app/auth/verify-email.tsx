import { Redirect, router, useLocalSearchParams } from 'expo-router';

import { useAuthSession } from '@/features/auth/context/auth-session-provider';
import { resendVerificationEmail } from '@/features/auth/data/firebase-auth';
import { VerifyEmailScreen } from '@/features/auth/screens/verify-email-screen';

export default function VerifyEmailRoute() {
  const session = useAuthSession();
  const params = useLocalSearchParams<{ email?: string | string[] }>();
  const email = Array.isArray(params.email) ? params.email[0] : params.email;

  if (session.status === 'anonymous') {
    return <Redirect href="/auth/sign-in" />;
  }

  if (session.user?.emailVerified) {
    return <Redirect href="/home" />;
  }

  async function handleUseAnotherAccount() {
    await session.signOut();
    router.replace('/auth/sign-in');
  }

  return (
    <VerifyEmailScreen
      email={email ?? 'your email address'}
      onBack={() => (router.canGoBack() ? router.back() : router.replace('/auth/sign-in'))}
      onContinue={() => router.replace('/home')}
      onResend={resendVerificationEmail}
      onUseAnotherAccount={handleUseAnotherAccount}
    />
  );
}
