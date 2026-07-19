import { router } from 'expo-router';

import { signIn } from '@/features/auth/data/firebase-auth';
import type { SignInValues } from '@/features/auth/domain/schemas';
import { SignInScreen } from '@/features/auth/screens/sign-in-screen';

export default function SignInRoute() {
  async function handleSignIn(values: SignInValues) {
    const user = await signIn(values);

    if (!user.emailVerified) {
      router.replace({
        pathname: '/auth/verify-email',
        params: { email: user.email ?? values.email },
      });
      return;
    }

    router.replace('/home');
  }

  return (
    <SignInScreen
      onBack={() => (router.canGoBack() ? router.back() : router.replace('/'))}
      onContinueAsGuest={() => router.replace('/home')}
      onCreateAccount={() => router.push('/auth/sign-up')}
      onForgotPassword={() => router.push('/auth/forgot-password')}
      onSubmit={handleSignIn}
    />
  );
}
