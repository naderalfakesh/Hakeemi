import { Redirect, router, useLocalSearchParams } from 'expo-router';

import { useAuthSession } from '@/features/auth/context/auth-session-provider';
import { getCurrentAuthUser, resendVerificationEmail } from '@/features/auth/data/firebase-auth';
import { AuthActionError } from '@/features/auth/domain/types';
import { VerifyEmailScreen } from '@/features/auth/screens/verify-email-screen';
import {
  bookingDestination,
  bookingReturnParams,
  readBookingReturn,
} from '@/features/booking/navigation/booking-return';

export default function VerifyEmailRoute() {
  const session = useAuthSession();
  const params = useLocalSearchParams<{
    bookingProviderId?: string | string[];
    bookingSlotId?: string | string[];
    email?: string | string[];
  }>();
  const email = Array.isArray(params.email) ? params.email[0] : params.email;
  const bookingReturn = readBookingReturn(params);
  const returnParams = bookingReturnParams(bookingReturn);

  if (session.status === 'anonymous') {
    return <Redirect href={{ pathname: '/auth/sign-in', params: returnParams }} />;
  }

  if (session.user?.emailVerified) {
    return <Redirect href={bookingDestination(bookingReturn)} />;
  }

  async function handleUseAnotherAccount() {
    await session.signOut();
    router.replace({ pathname: '/auth/sign-in', params: returnParams });
  }

  async function handleContinue() {
    const user = await getCurrentAuthUser();
    await session.refreshSession();

    if (!user?.emailVerified) {
      throw new AuthActionError(
        'unknown',
        'Your email is not verified yet. Open the link we sent, then try again.',
      );
    }

    router.replace(bookingDestination(bookingReturn));
  }

  return (
    <VerifyEmailScreen
      email={email ?? 'your email address'}
      onBack={() => (router.canGoBack() ? router.back() : router.replace('/auth/sign-in'))}
      onContinue={handleContinue}
      onResend={resendVerificationEmail}
      onUseAnotherAccount={handleUseAnotherAccount}
    />
  );
}
