import { router } from 'expo-router';

import { AppointmentsScreen as AppointmentsFeatureScreen } from '@/features/appointments/screens/appointments-screen';

export default function AppointmentsScreen() {
  return (
    <AppointmentsFeatureScreen
      onFindCare={() => router.push('/find-care')}
      onSignIn={() => router.push('/auth/sign-in')}
    />
  );
}
