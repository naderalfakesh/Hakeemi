import { router, useLocalSearchParams } from 'expo-router';

import { resendVerificationEmail, signOut } from '@/features/auth/data/firebase-auth';
import { VerifyEmailScreen } from '@/features/auth/screens/verify-email-screen';

export default function VerifyEmailRoute() {
  const params = useLocalSearchParams<{ email?: string | string[] }>();
  const email = Array.isArray(params.email) ? params.email[0] : params.email;

  async function handleUseAnotherAccount() {
    await signOut();
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
