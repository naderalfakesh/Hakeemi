import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';

import { LaunchGate } from '@/components/navigation/launch-gate';
import { useAuthSession } from '@/features/auth/context/auth-session-provider';
import { onboardingStorage } from '@/features/onboarding/data/onboarding-storage';
import { logSafeError } from '@/services/logging/safe-logger';

type EntryDestination = 'onboarding' | 'welcome' | null;

export default function EntryRoute() {
  const session = useAuthSession();
  const [destination, setDestination] = useState<EntryDestination>(null);

  useEffect(() => {
    let isMounted = true;

    void onboardingStorage
      .hasCompleted()
      .then((hasCompleted) => {
        if (isMounted) {
          setDestination(hasCompleted ? 'welcome' : 'onboarding');
        }
      })
      .catch((error: unknown) => {
        logSafeError('onboarding-storage-read', error);
        if (isMounted) {
          setDestination('onboarding');
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  if (session.status === 'authenticated') {
    return <Redirect href={session.user?.emailVerified ? '/home' : '/auth/verify-email'} />;
  }

  if (session.status === 'demo') {
    return <Redirect href="/home" />;
  }

  if (!destination) {
    return <LaunchGate />;
  }

  return <Redirect href={destination === 'welcome' ? '/welcome' : '/onboarding'} />;
}
