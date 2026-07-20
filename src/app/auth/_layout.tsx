import { Stack } from 'expo-router';

import { useAppMotion } from '@/theme';

export default function AuthLayout() {
  const { prefersReducedMotion } = useAppMotion();

  return (
    <Stack
      screenOptions={{
        animation: prefersReducedMotion ? 'none' : 'default',
        headerShown: false,
      }}
    />
  );
}
