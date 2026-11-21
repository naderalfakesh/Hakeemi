import { Redirect, router } from 'expo-router';

import { signIn } from '@/features/auth/data/firebase-auth';
import { useAuthSession } from '@/features/auth/context/auth-session-provider';
import type { SignInValues } from '@/features/auth/domain/schemas';
import { SignInScreen } from '@/features/auth/screens/sign-in-screen';
import { bookingDestination, useBookingReturn } from '@/features/booking/navigation/booking-return';

export default function SignInRoute() {
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

  // The session redirect above navigates once the signed-in user is restored.
  async function handleSignIn(values: SignInValues) {
    await signIn(values);
    await session.refreshSession();
  }

  return (
    <SignInScreen
      onBack={() => (router.canGoBack() ? router.back() : router.replace('/'))}
      onContinueAsGuest={() => router.replace('/home')}
      onCreateAccount={() => router.push({ pathname: '/auth/sign-up', params: returnParams })}
      onForgotPassword={() => router.push('/auth/forgot-password')}
      onSubmit={handleSignIn}
    />
  );
}
