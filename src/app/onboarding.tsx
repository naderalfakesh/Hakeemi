import { router } from 'expo-router';
import { useCallback } from 'react';

import { onboardingStorage } from '@/features/onboarding/data/onboarding-storage';
import { OnboardingScreen } from '@/features/onboarding/screens/onboarding-screen';
import { logSafeError } from '@/services/logging/safe-logger';

export default function OnboardingRoute() {
  const finishOnboarding = useCallback(() => {
    void onboardingStorage
      .markCompleted()
      .catch((error: unknown) => logSafeError('onboarding-storage-write', error))
      .finally(() => router.replace('/welcome'));
  }, []);

  return <OnboardingScreen onComplete={finishOnboarding} onSkip={finishOnboarding} />;
}
