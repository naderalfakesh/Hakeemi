import * as Network from 'expo-network';
import { Redirect, router, useLocalSearchParams } from 'expo-router';

import { useBookAppointment } from '@/features/appointments/hooks/use-book-appointment';
import { localizeAppointmentError } from '@/features/appointments/localization/appointment-error-strings';
import { useAuthSession } from '@/features/auth/context/auth-session-provider';
import { BookingRouteState } from '@/features/booking/components/booking-route-state';
import { useBookingDraft } from '@/features/booking/context/booking-draft-provider';
import { useBookingSelection } from '@/features/booking/hooks/use-booking-selection';
import { BookingReviewScreen } from '@/features/booking/screens/booking-review-screen';
import { useAppDataSources } from '@/features/demo/use-app-data-sources';
import { useAppLocale } from '@/localization/locale-provider';

const alwaysConnected = async () => true;

export default function BookingReviewRoute() {
  const params = useLocalSearchParams<{
    providerId?: string | string[];
    slotId?: string | string[];
  }>();
  const providerId = readParam(params.providerId);
  const slotId = readParam(params.slotId);
  const session = useAuthSession();
  const dataSources = useAppDataSources();
  const draftContext = useBookingDraft();
  const selection = useBookingSelection(
    providerId,
    slotId,
    dataSources.careRepository,
    dataSources.scope,
  );
  const booking = useBookAppointment(
    dataSources.isDemo
      ? {
          checkConnection: alwaysConnected,
          repository: dataSources.appointmentRepository,
        }
      : { repository: dataSources.appointmentRepository },
  );
  const networkState = Network.useNetworkState();
  const { locale } = useAppLocale();
  const draft = draftContext.draft;

  if (session.status === 'anonymous') {
    return (
      <Redirect
        href={{
          pathname: '/auth/sign-in',
          params: { bookingProviderId: providerId, bookingSlotId: slotId },
        }}
      />
    );
  }

  if (session.status === 'authenticated' && !session.user?.emailVerified) {
    return (
      <Redirect
        href={{
          pathname: '/auth/verify-email',
          params: { bookingProviderId: providerId, bookingSlotId: slotId },
        }}
      />
    );
  }

  if (!draft || draft.providerId !== providerId || draft.slotId !== slotId) {
    return <Redirect href={{ pathname: '/booking/details', params: { providerId, slotId } }} />;
  }

  if (selection.state.status !== 'success') {
    return (
      <BookingRouteState
        onBack={() => router.replace(`/providers/${providerId}`)}
        onRetry={selection.retry}
        status={selection.state.status}
      />
    );
  }

  const isOnline = dataSources.isDemo
    ? true
    : networkState.isConnected === undefined
      ? null
      : networkState.isConnected && networkState.isInternetReachable !== false;

  async function handleConfirm() {
    if (!draft) {
      return;
    }

    try {
      const result = await booking.confirm({
        reasonCategory: draft.reasonCategory,
        requestId: draft.requestId,
        slotId: draft.slotId,
      });
      await draftContext.clear();
      router.replace({
        pathname: '/booking/confirmation',
        params: { appointmentId: result.appointment.id },
      });
    } catch {
      // The mutation exposes the mapped, retry-safe error to the screen.
    }
  }

  return (
    <BookingReviewScreen
      error={booking.error ? localizeAppointmentError(booking.error, locale) : null}
      isOnline={isOnline}
      isSubmitting={booking.status === 'pending'}
      onBack={() => router.back()}
      onConfirm={() => void handleConfirm()}
      reasonCategory={draft.reasonCategory}
      selection={selection.state.data}
    />
  );
}

function readParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? (value[0] ?? '') : (value ?? '');
}
