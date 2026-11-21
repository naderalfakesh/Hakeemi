import { router, useLocalSearchParams } from 'expo-router';

import { AppointmentDetailScreen } from '@/features/appointments/screens/appointment-detail-screen';
import { useAppDataSources } from '@/features/demo/use-app-data-sources';
import { firstParam } from '@/navigation/route-params';

export default function AppointmentDetailRoute() {
  const params = useLocalSearchParams<{ appointmentId?: string | string[] }>();
  const appointmentId = firstParam(params.appointmentId);
  const dataSources = useAppDataSources();

  return (
    <AppointmentDetailScreen
      appointmentId={appointmentId}
      appointmentRepository={dataSources.appointmentRepository}
      careDataRepository={dataSources.careRepository}
      onBack={() => {
        if (router.canGoBack()) {
          router.back();
          return;
        }
        router.replace('/(tabs)/appointments');
      }}
      onFindCare={() => router.replace('/find-care')}
      queryScope={dataSources.scope}
    />
  );
}
