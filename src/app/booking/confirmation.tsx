import { useQuery } from '@tanstack/react-query';
import { Redirect, router, useLocalSearchParams } from 'expo-router';

import { useAppointmentDetail } from '@/features/appointments/hooks/use-appointment-detail';
import { useAuthSession } from '@/features/auth/context/auth-session-provider';
import { BookingRouteState } from '@/features/booking/components/booking-route-state';
import { BookingConfirmationScreen } from '@/features/booking/screens/booking-confirmation-screen';
import { useAppDataSources } from '@/features/demo/use-app-data-sources';

export default function BookingConfirmationRoute() {
  const params = useLocalSearchParams<{ appointmentId?: string | string[] }>();
  const appointmentId = Array.isArray(params.appointmentId)
    ? (params.appointmentId[0] ?? '')
    : (params.appointmentId ?? '');
  const session = useAuthSession();
  const dataSources = useAppDataSources();
  const appointmentQuery = useAppointmentDetail(
    appointmentId,
    dataSources.appointmentRepository,
    dataSources.scope,
    session.user?.id ?? null,
  );
  const providerQuery = useQuery({
    enabled: Boolean(appointmentQuery.data?.providerId),
    queryKey: [
      'care',
      dataSources.scope,
      'confirmation-provider',
      appointmentQuery.data?.providerId ?? 'pending',
    ],
    queryFn: () => dataSources.careRepository.getProvider(appointmentQuery.data?.providerId ?? ''),
  });

  if (session.status === 'anonymous') {
    return <Redirect href="/auth/sign-in" />;
  }

  if (appointmentQuery.isPending || (appointmentQuery.data && providerQuery.isPending)) {
    return (
      <BookingRouteState
        onBack={() => router.replace('/appointments')}
        onRetry={() => {}}
        status="loading"
      />
    );
  }

  if (appointmentQuery.isError || providerQuery.isError) {
    return (
      <BookingRouteState
        onBack={() => router.replace('/appointments')}
        onRetry={() => {
          void appointmentQuery.refetch();
          void providerQuery.refetch();
        }}
        status="error"
      />
    );
  }

  if (!appointmentQuery.data) {
    return (
      <BookingRouteState
        onBack={() => router.replace('/appointments')}
        onRetry={() => void appointmentQuery.refetch()}
        status="not-found"
      />
    );
  }

  return (
    <BookingConfirmationScreen
      appointment={appointmentQuery.data}
      onFindCare={() => router.replace('/find-care')}
      onViewAppointments={() => router.replace('/appointments')}
      provider={providerQuery.data ?? null}
    />
  );
}
