import { Redirect, router, useFocusEffect } from 'expo-router';
import { useCallback } from 'react';

import { useAuthSession } from '@/features/auth/context/auth-session-provider';
import { BookingRouteState } from '@/features/booking/components/booking-route-state';
import { useBookingDraft } from '@/features/booking/context/booking-draft-provider';
import { useBookingSelection } from '@/features/booking/hooks/use-booking-selection';
import { bookingStrings } from '@/features/booking/localization/booking-strings';
import {
  bookingAccessRedirect,
  useBookingTarget,
} from '@/features/booking/navigation/booking-return';
import { BookingDetailsScreen } from '@/features/booking/screens/booking-details-screen';
import { useAppDataSources } from '@/features/demo/use-app-data-sources';
import { useStrings } from '@/localization/use-strings';

export default function BookingDetailsRoute() {
  const target = useBookingTarget();
  const { providerId, slotId } = target;
  const session = useAuthSession();
  const dataSources = useAppDataSources();
  const bookingDraft = useBookingDraft();
  const selection = useBookingSelection(target, {
    queryScope: dataSources.scope,
    repository: dataSources.careRepository,
  });
  const strings = useStrings(bookingStrings);
  // Details is the first step of the booking sheet, so leaving it closes the
  // sheet and shows the clinician underneath.
  const closeBooking = () =>
    router.canGoBack()
      ? router.back()
      : router.replace({ pathname: '/providers/[providerId]', params: { providerId } });

  // Only the focused screen seeds a draft. Once a booking is confirmed this
  // screen may still be mounted while it animates away, and must not start a
  // new draft for the slot that was just booked.
  useFocusEffect(
    useCallback(() => {
      if (
        bookingDraft.status !== 'loading' &&
        (bookingDraft.draft?.providerId !== providerId || bookingDraft.draft.slotId !== slotId) &&
        providerId &&
        slotId
      ) {
        void bookingDraft.selectSlot(providerId, slotId);
      }
    }, [bookingDraft, providerId, slotId]),
  );

  const accessRedirect = bookingAccessRedirect(session, target);

  if (accessRedirect) {
    return <Redirect href={accessRedirect} />;
  }

  if (selection.state.status !== 'success') {
    return (
      <BookingRouteState
        onBack={closeBooking}
        onRetry={selection.retry}
        status={selection.state.status}
      />
    );
  }

  const draft = bookingDraft.draft;

  if (!draft || draft.providerId !== providerId || draft.slotId !== slotId) {
    return <BookingRouteState onBack={closeBooking} onRetry={() => {}} status="loading" />;
  }

  return (
    <BookingDetailsScreen
      error={bookingDraft.error ? strings.draftErrors[bookingDraft.error] : null}
      isSaving={bookingDraft.status === 'saving'}
      onBack={closeBooking}
      onContinue={() =>
        router.push({ pathname: '/booking/review', params: { providerId, slotId } })
      }
      onReasonCategoryChange={(reason) => void bookingDraft.setReasonCategory(reason)}
      reasonCategory={draft.reasonCategory}
      selection={selection.state.data}
    />
  );
}
