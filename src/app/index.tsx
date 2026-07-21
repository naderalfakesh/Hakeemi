import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { useAuthSession } from '@/features/auth/context/auth-session-provider';
import { onboardingStorage } from '@/features/onboarding/data/onboarding-storage';
import { logSafeError } from '@/services/logging/safe-logger';
import { useAppTheme } from '@/theme';

type EntryDestination = 'onboarding' | 'welcome' | null;

export default function EntryRoute() {
  const session = useAuthSession();
  const theme = useAppTheme();
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

  if (!destination) {
    return (
      <View style={[styles.loading, { backgroundColor: theme.colors.canvas }]}>
        <ActivityIndicator color={theme.colors.brand} size="large" />
      </View>
    );
  }

  return <Redirect href={destination === 'welcome' ? '/welcome' : '/onboarding'} />;
}

const styles = StyleSheet.create({
  loading: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
});
