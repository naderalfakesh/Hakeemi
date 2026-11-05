import { Redirect, router, useLocalSearchParams } from 'expo-router';

import { useAuthSession } from '@/features/auth/context/auth-session-provider';
import { getCurrentAuthUser, resendVerificationEmail } from '@/features/auth/data/firebase-auth';
import { AuthActionError } from '@/features/auth/domain/types';
import { verifyEmailStrings } from '@/features/auth/localization/auth-strings';
import { VerifyEmailScreen } from '@/features/auth/screens/verify-email-screen';
import {
  bookingDestination,
  bookingReturnParams,
  readBookingReturn,
} from '@/features/booking/navigation/booking-return';
import { useStrings } from '@/localization/use-strings';

export default function VerifyEmailRoute() {
  const session = useAuthSession();
  const strings = useStrings(verifyEmailStrings);
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

  // Both actions only refresh the session; the redirects above navigate once
  // the session reflects the change.
  async function handleUseAnotherAccount() {
    await session.signOut();
  }

  async function handleContinue() {
    const user = await getCurrentAuthUser();

    if (!user?.emailVerified) {
      throw new AuthActionError(
        'email-not-verified',
        'Your email is not verified yet. Open the link we sent, then try again.',
      );
    }

    await session.refreshSession();
  }

  return (
    <VerifyEmailScreen
      email={email ?? session.user?.email ?? strings.yourEmailAddress}
      onBack={() => (router.canGoBack() ? router.back() : router.replace('/auth/sign-in'))}
      onContinue={handleContinue}
      onResend={resendVerificationEmail}
      onUseAnotherAccount={handleUseAnotherAccount}
    />
  );
}
