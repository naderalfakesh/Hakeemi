import { router, type Href } from 'expo-router';

import { AppointmentsScreen as AppointmentsFeatureScreen } from '@/features/appointments/screens/appointments-screen';
import { useAppDataSources } from '@/features/demo/use-app-data-sources';

export default function AppointmentsScreen() {
  const dataSources = useAppDataSources();

  return (
    <AppointmentsFeatureScreen
      appointmentRepository={dataSources.appointmentRepository}
      careDataRepository={dataSources.careRepository}
      onFindCare={() => router.push('/find-care')}
      onSignIn={() => router.push('/auth/sign-in')}
      onViewAppointment={(appointmentId) => router.push(`/appointments/${appointmentId}` as Href)}
      queryScope={dataSources.scope}
    />
  );
}
