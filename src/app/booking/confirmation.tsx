import { useQuery } from '@tanstack/react-query';
import { Redirect, router, useLocalSearchParams } from 'expo-router';

import { calendarLinkOwner } from '@/features/appointments/data/calendar-link-storage';
import { useAppointmentCalendar } from '@/features/appointments/hooks/use-appointment-calendar';
import { useAppointmentDetail } from '@/features/appointments/hooks/use-appointment-detail';
import { useAuthSession } from '@/features/auth/context/auth-session-provider';
import { BookingRouteState } from '@/features/booking/components/booking-route-state';
import { BookingConfirmationScreen } from '@/features/booking/screens/booking-confirmation-screen';
import { bookingStrings } from '@/features/booking/localization/booking-strings';
import { careQueryKeys } from '@/features/care/data/query-keys';
import { fetchProviderDetailSummary } from '@/features/care/hooks/use-provider-detail';
import { useAppDataSources } from '@/features/demo/use-app-data-sources';
import { useAppLocale } from '@/localization/locale-provider';
import { useStrings } from '@/localization/use-strings';
import { firstParam } from '@/navigation/route-params';

export default function BookingConfirmationRoute() {
  const params = useLocalSearchParams<{ appointmentId?: string | string[] }>();
  const appointmentId = firstParam(params.appointmentId);
  const session = useAuthSession();
  const dataSources = useAppDataSources();
  const appointmentQuery = useAppointmentDetail(appointmentId, {
    accountId: dataSources.accountId,
    queryScope: dataSources.scope,
    repository: dataSources.appointmentRepository,
  });
  const providerId = appointmentQuery.data?.providerId ?? '';
  const providerQuery = useQuery({
    enabled: providerId.length > 0,
    queryKey: careQueryKeys.detail(providerId, dataSources.scope),
    queryFn: () => fetchProviderDetailSummary(dataSources.careRepository, providerId),
  });
  const provider = providerQuery.data?.provider ?? null;
  const { locale } = useAppLocale();
  const strings = useStrings(bookingStrings);
  const calendar = useAppointmentCalendar({
    appointment: appointmentQuery.data ?? null,
    owner: calendarLinkOwner(dataSources.scope, dataSources.accountId),
    providerName: provider?.displayName[locale] ?? strings.confirmation.confirmedProviderFallback,
  });

  if (session.status === 'anonymous') {
    return <Redirect href="/auth/sign-in" />;
  }

  if (appointmentQuery.isPending || (appointmentQuery.data && providerQuery.isPending)) {
    return (
      <BookingRouteState
        onBack={() => router.dismissTo('/appointments')}
        onRetry={() => {}}
        status="loading"
      />
    );
  }

  if (appointmentQuery.isError || providerQuery.isError) {
    return (
      <BookingRouteState
        onBack={() => router.dismissTo('/appointments')}
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
        onBack={() => router.dismissTo('/appointments')}
        onRetry={() => void appointmentQuery.refetch()}
        status="not-found"
      />
    );
  }

  return (
    <BookingConfirmationScreen
      appointment={appointmentQuery.data}
      calendar={calendar}
      onFindCare={() => router.dismissTo('/find-care')}
      onViewAppointments={() => router.dismissTo('/appointments')}
      provider={provider}
    />
  );
}
