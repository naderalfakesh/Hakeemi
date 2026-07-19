import { router } from 'expo-router';

import { useAuthSession } from '@/features/auth/context/auth-session-provider';
import { ProfileScreen } from '@/features/auth/screens/profile-screen';

export default function ProfileRoute() {
  const session = useAuthSession();

  return (
    <ProfileScreen
      onCreateAccount={() => router.push('/auth/sign-up')}
      onRetryProfile={session.retryProfile}
      onSignIn={() => router.push('/auth/sign-in')}
      onSignOut={session.signOut}
      profile={session.profile}
      profileError={session.profileError}
      profileStatus={session.profileStatus}
      user={session.user}
    />
  );
}
