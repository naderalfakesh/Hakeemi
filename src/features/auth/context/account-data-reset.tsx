import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';

import { appointmentQueryKeys } from '@/features/appointments/data/query-keys';
import { useBookingDraft } from '@/features/booking/context/booking-draft-provider';

import { useAuthSession } from './auth-session-provider';

/**
 * Drops account-private client state when a signed-in account ends, so the
 * next account on the same device starts from an empty cache and no draft.
 */
export function AccountDataReset() {
  const session = useAuthSession();
  const queryClient = useQueryClient();
  const { clear: clearBookingDraft } = useBookingDraft();
  const accountId = session.status === 'authenticated' ? (session.user?.id ?? null) : null;
  const previousAccountId = useRef(accountId);

  useEffect(() => {
    const endedAccountId = previousAccountId.current;
    previousAccountId.current = accountId;

    // Only a signed-in account ending counts: a draft started while signed
    // out must survive the sign-in redirect that resumes booking.
    if (endedAccountId === null || endedAccountId === accountId) {
      return;
    }

    // Removing (rather than invalidating) also discards responses still in
    // flight for the ended account.
    queryClient.removeQueries({ queryKey: appointmentQueryKeys.account(endedAccountId) });
    void clearBookingDraft();
  }, [accountId, clearBookingDraft, queryClient]);

  return null;
}
