import { router } from 'expo-router';

import { useAuthSession } from '@/features/auth/context/auth-session-provider';
import { WelcomeScreen } from '@/features/onboarding/screens/welcome-screen';

export default function WelcomeRoute() {
  const session = useAuthSession();

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
