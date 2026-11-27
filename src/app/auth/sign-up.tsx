import { Redirect, router } from 'expo-router';

import { signUp } from '@/features/auth/data/firebase-auth';
import { useAuthSession } from '@/features/auth/context/auth-session-provider';
import type { SignUpValues } from '@/features/auth/domain/schemas';
import { SignUpScreen } from '@/features/auth/screens/sign-up-screen';
import { bookingDestination, useBookingReturn } from '@/features/booking/navigation/booking-return';

export default function SignUpRoute() {
  const session = useAuthSession();
  const { bookingReturn, returnParams } = useBookingReturn();

  if (session.status === 'authenticated') {
    return (
      <Redirect
        href={
          session.user?.emailVerified
            ? bookingDestination(bookingReturn)
            : { pathname: '/auth/verify-email', params: returnParams }
        }
      />
    );
  }

  async function handleSignUp(values: SignUpValues) {
    await signUp({
      displayName: values.displayName,
      email: values.email,
      password: values.password,
    });
    await session.refreshSession();
  }

  return (
    <SignUpScreen
      onBack={() => (router.canGoBack() ? router.back() : router.replace('/'))}
      onSignIn={() => router.replace({ pathname: '/auth/sign-in', params: returnParams })}
      onSubmit={handleSignUp}
    />
  );
}
