import * as Network from 'expo-network';
import { Redirect, router } from 'expo-router';
import { useState } from 'react';

import type { AppointmentReasonCategory } from '@/features/appointments/domain/types';
import { useBookAppointment } from '@/features/appointments/hooks/use-book-appointment';
import { localizeAppointmentError } from '@/features/appointments/localization/appointment-error-strings';
import { useAuthSession } from '@/features/auth/context/auth-session-provider';
import { BookingRouteState } from '@/features/booking/components/booking-route-state';
import { useBookingDraft } from '@/features/booking/context/booking-draft-provider';
import { useBookingSelection } from '@/features/booking/hooks/use-booking-selection';
import {
  bookingAccessRedirect,
  useBookingTarget,
} from '@/features/booking/navigation/booking-return';
import { BookingReviewScreen } from '@/features/booking/screens/booking-review-screen';
import { useAppDataSources } from '@/features/demo/use-app-data-sources';
import { useAppLocale } from '@/localization/locale-provider';

export default function BookingReviewRoute() {
  const target = useBookingTarget();
  const { providerId, slotId } = target;
  const session = useAuthSession();
  const dataSources = useAppDataSources();
  const draftContext = useBookingDraft();
  const selection = useBookingSelection(target, {
    queryScope: dataSources.scope,
    repository: dataSources.careRepository,
  });
  const booking = useBookAppointment({
    accountId: dataSources.accountId,
    queryScope: dataSources.scope,
    repository: dataSources.appointmentRepository,
  });
  const networkState = Network.useNetworkState();
  const { locale } = useAppLocale();
  // The confirmed reason stays on screen while it hands over to confirmation.
  const [confirmedReason, setConfirmedReason] = useState<AppointmentReasonCategory | null>(null);
  const draft = draftContext.draft;

  const accessRedirect = bookingAccessRedirect(session, target);

  if (accessRedirect) {
    return <Redirect href={accessRedirect} />;
  }

  // After a successful booking the draft is cleared while this screen is on
  // its way out; redirecting then would start a new draft for the booked slot.
  if (
    booking.status !== 'success' &&
    (!draft || draft.providerId !== providerId || draft.slotId !== slotId)
  ) {
    return <Redirect href={{ pathname: '/booking/details', params: { providerId, slotId } }} />;
  }

  if (selection.state.status !== 'success') {
    if (booking.status === 'success') {
      return null;
    }

    return (
      <BookingRouteState
        onBack={() => router.back()}
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

    let appointmentId: string;

    try {
      const result = await booking.confirm({
        reasonCategory: draft.reasonCategory,
        requestId: draft.requestId,
        slotId: draft.slotId,
      });
      appointmentId = result.appointment.id;
      setConfirmedReason(draft.reasonCategory);
    } catch {
      // The mutation exposes the mapped, retry-safe error to the screen.
      return;
    }

    // Confirmation replaces the whole booking flow, so the details screen below
    // cannot start a new draft for the slot that was just booked.
    if (router.canDismiss()) {
      router.dismissAll();
    }
    router.replace({ pathname: '/booking/confirmation', params: { appointmentId } });
    // A draft that outlives a failed clear expires on its own and its request
    // ID would only replay the booking that already succeeded.
    await draftContext.clear().catch(() => undefined);
  }

  return (
    <BookingReviewScreen
      error={booking.error ? localizeAppointmentError(booking.error, locale) : null}
      isOnline={isOnline}
      isSubmitting={booking.status === 'pending'}
      onBack={() => router.back()}
      onConfirm={() => void handleConfirm()}
      reasonCategory={draft?.reasonCategory ?? confirmedReason}
      selection={selection.state.data}
    />
  );
}
