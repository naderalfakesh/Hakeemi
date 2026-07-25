import { router, useLocalSearchParams } from 'expo-router';

import { AppointmentDetailScreen } from '@/features/appointments/screens/appointment-detail-screen';
import { useAppDataSources } from '@/features/demo/use-app-data-sources';

export default function AppointmentDetailRoute() {
  const { appointmentId: rawAppointmentId } = useLocalSearchParams<{
    appointmentId?: string | string[];
  }>();
  const appointmentId = Array.isArray(rawAppointmentId)
    ? (rawAppointmentId[0] ?? '')
    : (rawAppointmentId ?? '');
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
