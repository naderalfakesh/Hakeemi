import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useEffect } from 'react';

import { useAuthSession } from '@/features/auth/context/auth-session-provider';
import { BookingRouteState } from '@/features/booking/components/booking-route-state';
import { useBookingDraft } from '@/features/booking/context/booking-draft-provider';
import { useBookingSelection } from '@/features/booking/hooks/use-booking-selection';
import { bookingStrings } from '@/features/booking/localization/booking-strings';
import { BookingDetailsScreen } from '@/features/booking/screens/booking-details-screen';
import { useAppDataSources } from '@/features/demo/use-app-data-sources';
import { useStrings } from '@/localization/use-strings';

export default function BookingDetailsRoute() {
  const { providerId, slotId } = useBookingParams();
  const session = useAuthSession();
  const dataSources = useAppDataSources();
  const bookingDraft = useBookingDraft();
  const selection = useBookingSelection(
    providerId,
    slotId,
    dataSources.careRepository,
    dataSources.scope,
  );
  const strings = useStrings(bookingStrings);

  useEffect(() => {
    if (
      bookingDraft.status !== 'loading' &&
      (bookingDraft.draft?.providerId !== providerId || bookingDraft.draft.slotId !== slotId) &&
      providerId &&
      slotId
    ) {
      void bookingDraft.selectSlot(providerId, slotId);
    }
  }, [bookingDraft, providerId, slotId]);

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

  if (selection.state.status !== 'success') {
    return (
      <BookingRouteState
        onBack={() => router.replace(`/providers/${providerId}`)}
        onRetry={selection.retry}
        status={selection.state.status}
      />
    );
  }

  const draft = bookingDraft.draft;

  if (!draft || draft.providerId !== providerId || draft.slotId !== slotId) {
    return <BookingRouteState onBack={() => router.back()} onRetry={() => {}} status="loading" />;
  }

  return (
    <BookingDetailsScreen
      error={bookingDraft.error ? strings.draftErrors[bookingDraft.error] : null}
      isSaving={bookingDraft.status === 'saving'}
      onBack={() => router.replace(`/providers/${providerId}`)}
      onContinue={() =>
        router.push({ pathname: '/booking/review', params: { providerId, slotId } })
      }
      onReasonCategoryChange={(reason) => void bookingDraft.setReasonCategory(reason)}
      reasonCategory={draft.reasonCategory}
      selection={selection.state.data}
    />
  );
}

function useBookingParams() {
  const params = useLocalSearchParams<{
    providerId?: string | string[];
    slotId?: string | string[];
  }>();

  return {
    providerId: readParam(params.providerId),
    slotId: readParam(params.slotId),
  };
}

function readParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? (value[0] ?? '') : (value ?? '');
}
