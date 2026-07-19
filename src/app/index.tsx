import { router } from 'expo-router';

import { DemoEntryScreen } from '@/features/onboarding/screens/demo-entry-screen';

export default function DemoEntryRoute() {
  return (
    <DemoEntryScreen
      onContinue={() => router.replace('/home')}
      onSignIn={() => router.push('/auth/sign-in')}
    />
  );
}
