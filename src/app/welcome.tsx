import { Redirect, router } from 'expo-router';

import { useAuthSession } from '@/features/auth/context/auth-session-provider';
import { WelcomeScreen } from '@/features/onboarding/screens/welcome-screen';

export default function WelcomeRoute() {
  const session = useAuthSession();

  if (session.status === 'authenticated') {
    return <Redirect href={session.user?.emailVerified ? '/home' : '/auth/verify-email'} />;
  }

  if (session.status === 'demo') {
    return <Redirect href="/home" />;
  }

  return (
    <WelcomeScreen
      onCreateAccount={() => router.push('/auth/sign-up')}
      onExploreDemo={() => {
        session.enterDemo();
        router.replace('/home');
      }}
      onSignIn={() => router.push('/auth/sign-in')}
    />
  );
}
