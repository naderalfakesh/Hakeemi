import { Stack, useLocalSearchParams } from 'expo-router';

import { PlaceholderScreen } from '@/components/navigation/placeholder-screen';

export default function ProviderRoute() {
  const { providerId } = useLocalSearchParams<{ providerId: string }>();

  return (
    <>
      <Stack.Screen options={{ headerShown: true, title: 'Provider' }} />
      <PlaceholderScreen
        description={`The full fixture-backed profile for ${providerId} is the next focused checkpoint.`}
        title="Provider profile"
      />
    </>
  );
}
