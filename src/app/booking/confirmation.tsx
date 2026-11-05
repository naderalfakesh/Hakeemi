import { useQuery } from '@tanstack/react-query';
import { Redirect, router, useLocalSearchParams } from 'expo-router';

import { calendarLinkOwner } from '@/features/appointments/data/calendar-link-storage';
import { useAppointmentCalendar } from '@/features/appointments/hooks/use-appointment-calendar';
import { useAppointmentDetail } from '@/features/appointments/hooks/use-appointment-detail';
import { useAuthSession } from '@/features/auth/context/auth-session-provider';
import { BookingRouteState } from '@/features/booking/components/booking-route-state';
import { BookingConfirmationScreen } from '@/features/booking/screens/booking-confirmation-screen';
import { bookingStrings } from '@/features/booking/localization/booking-strings';
import { useAppDataSources } from '@/features/demo/use-app-data-sources';
import { useAppLocale } from '@/localization/locale-provider';
import { useStrings } from '@/localization/use-strings';

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
  const { locale } = useAppLocale();
  const strings = useStrings(bookingStrings);
  // The same link the visit's detail screen reads, so an event added here
  // follows a later reschedule or cancellation from there.
  const calendar = useAppointmentCalendar({
    appointment: appointmentQuery.data ?? null,
    owner: calendarLinkOwner(dataSources.scope, session.user?.id ?? null),
    providerName:
      providerQuery.data?.displayName[locale] ?? strings.confirmation.confirmedProviderFallback,
  });

  // Confirmation is the last step of the booking sheet: both ways out close
  // the sheet and switch to the tab underneath instead of stacking a new one.
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
      provider={providerQuery.data ?? null}
    />
  );
}
