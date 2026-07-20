import { router, useLocalSearchParams } from 'expo-router';

import { AppointmentDetailScreen } from '@/features/appointments/screens/appointment-detail-screen';

export default function AppointmentDetailRoute() {
  const { appointmentId: rawAppointmentId } = useLocalSearchParams<{
    appointmentId?: string | string[];
  }>();
  const appointmentId = Array.isArray(rawAppointmentId)
    ? (rawAppointmentId[0] ?? '')
    : (rawAppointmentId ?? '');

  return (
    <AppointmentDetailScreen
      appointmentId={appointmentId}
      onBack={() => {
        if (router.canGoBack()) {
          router.back();
          return;
        }
        router.replace('/(tabs)/appointments');
      }}
      onFindCare={() => router.replace('/find-care')}
    />
  );
}
