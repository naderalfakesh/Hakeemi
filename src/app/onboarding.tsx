import { Redirect, router } from 'expo-router';
import { useCallback } from 'react';

import { useAuthSession } from '@/features/auth/context/auth-session-provider';
import { onboardingStorage } from '@/features/onboarding/data/onboarding-storage';
import { OnboardingScreen } from '@/features/onboarding/screens/demo-entry-screen';
import { useAppPreferences } from '@/features/preferences/context/app-preferences-provider';
import { logSafeError } from '@/services/logging/safe-logger';

export default function OnboardingRoute() {
  const session = useAuthSession();
  const { preferences, update } = useAppPreferences();
  const finishOnboarding = useCallback(() => {
    void onboardingStorage
      .markCompleted()
      .catch((error: unknown) => logSafeError('onboarding-storage-write', error))
      .finally(() => router.replace('/welcome'));
  }, []);

  if (session.status === 'authenticated') {
    return <Redirect href={session.user?.emailVerified ? '/home' : '/auth/verify-email'} />;
  }

  if (session.status === 'demo') {
    return <Redirect href="/home" />;
  }

  return (
    <OnboardingScreen
      onComplete={finishOnboarding}
      onSkip={finishOnboarding}
      onUpdatePreferences={update}
      preferences={preferences}
    />
  );
}
