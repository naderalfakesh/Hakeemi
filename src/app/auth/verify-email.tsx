import { Redirect, router, useLocalSearchParams } from 'expo-router';

import { useAuthSession } from '@/features/auth/context/auth-session-provider';
import { getCurrentAuthUser, resendVerificationEmail } from '@/features/auth/data/firebase-auth';
import { AuthActionError } from '@/features/auth/domain/types';
import { verifyEmailStrings } from '@/features/auth/localization/auth-strings';
import { VerifyEmailScreen } from '@/features/auth/screens/verify-email-screen';
import { bookingDestination, useBookingReturn } from '@/features/booking/navigation/booking-return';
import { firstParam } from '@/navigation/route-params';
import { useStrings } from '@/localization/use-strings';

export default function VerifyEmailRoute() {
  const session = useAuthSession();
  const strings = useStrings(verifyEmailStrings);
  const params = useLocalSearchParams<{ email?: string | string[] }>();
  const linkedEmail = firstParam(params.email);
  const { bookingReturn, returnParams } = useBookingReturn();

  if (session.status === 'anonymous') {
    return <Redirect href={{ pathname: '/auth/sign-in', params: returnParams }} />;
  }

  // A demo session has no account to verify, and a verified one is finished
  // here. Deep links can open this route in either state.
  if (session.status === 'demo' || session.user?.emailVerified) {
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
      // The signed-in address wins: the link's email parameter is unverified
      // input and must not be shown as the place a message was sent.
      email={session.user?.email ?? (linkedEmail || strings.yourEmailAddress)}
      onBack={() => (router.canGoBack() ? router.back() : router.replace('/auth/sign-in'))}
      onContinue={handleContinue}
      onResend={resendVerificationEmail}
      onUseAnotherAccount={handleUseAnotherAccount}
    />
  );
}
