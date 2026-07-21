import { Redirect, router } from 'expo-router';

import { useAuthSession } from '@/features/auth/context/auth-session-provider';
import { DemoEntryScreen } from '@/features/onboarding/screens/demo-entry-screen';

export default function DemoEntryRoute() {
  const session = useAuthSession();

  if (session.status === 'authenticated') {
    return <Redirect href={session.user?.emailVerified ? '/home' : '/auth/verify-email'} />;
  }

  return (
    <DemoEntryScreen
      onContinue={() => router.replace('/home')}
      onSignIn={() => router.push('/auth/sign-in')}
      onSignUp={() => router.push('/auth/sign-up')}
    />
  );
}
