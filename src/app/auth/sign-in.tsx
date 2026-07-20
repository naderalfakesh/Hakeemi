import { Redirect, router, useLocalSearchParams } from 'expo-router';

import { signIn } from '@/features/auth/data/firebase-auth';
import { useAuthSession } from '@/features/auth/context/auth-session-provider';
import type { SignInValues } from '@/features/auth/domain/schemas';
import { SignInScreen } from '@/features/auth/screens/sign-in-screen';
import {
  bookingDestination,
  bookingReturnParams,
  readBookingReturn,
} from '@/features/booking/navigation/booking-return';

export default function SignInRoute() {
  const session = useAuthSession();
  const params = useLocalSearchParams<{
    bookingProviderId?: string | string[];
    bookingSlotId?: string | string[];
  }>();
  const bookingReturn = readBookingReturn(params);
  const returnParams = bookingReturnParams(bookingReturn);

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

  async function handleSignIn(values: SignInValues) {
    const user = await signIn(values);
    await session.refreshSession();

    if (!user.emailVerified) {
      router.replace({
        pathname: '/auth/verify-email',
        params: { email: user.email ?? values.email, ...returnParams },
      });
      return;
    }

    router.replace(bookingDestination(bookingReturn));
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
