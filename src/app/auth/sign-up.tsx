import { Redirect, router } from 'expo-router';

import { signUp } from '@/features/auth/data/firebase-auth';
import { useAuthSession } from '@/features/auth/context/auth-session-provider';
import type { SignUpValues } from '@/features/auth/domain/schemas';
import { SignUpScreen } from '@/features/auth/screens/sign-up-screen';

export default function SignUpRoute() {
  const session = useAuthSession();

  if (session.status === 'authenticated') {
    return <Redirect href={session.user?.emailVerified ? '/home' : '/auth/verify-email'} />;
  }

  async function handleSignUp(values: SignUpValues) {
    const user = await signUp({
      displayName: values.displayName,
      email: values.email,
      password: values.password,
    });
    await session.refreshSession();

    router.replace({
      pathname: '/auth/verify-email',
      params: { email: user.email ?? values.email },
    });
  }

  return (
    <SignUpScreen
      onBack={() => (router.canGoBack() ? router.back() : router.replace('/'))}
      onSignIn={() => router.replace('/auth/sign-in')}
      onSubmit={handleSignUp}
    />
  );
}
