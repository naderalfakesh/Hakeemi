import { router } from 'expo-router';

import { signUp } from '@/features/auth/data/firebase-auth';
import type { SignUpValues } from '@/features/auth/domain/schemas';
import { SignUpScreen } from '@/features/auth/screens/sign-up-screen';

export default function SignUpRoute() {
  async function handleSignUp(values: SignUpValues) {
    const user = await signUp({
      displayName: values.displayName,
      email: values.email,
      password: values.password,
    });

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
