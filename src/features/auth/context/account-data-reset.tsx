import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';

import {
  calendarLinkOwner,
  calendarLinkStorage,
} from '@/features/appointments/data/calendar-link-storage';
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
  const calendarOwner =
    session.status === 'demo'
      ? calendarLinkOwner('demo', null)
      : calendarLinkOwner('account', accountId);
  const previousCalendarOwner = useRef(calendarOwner);

  // Calendar links follow the session that made them: signing out or leaving
  // the demo forgets them, so the next session's appointments (demo ids
  // repeat every session) never act on another session's events.
  useEffect(() => {
    const endedOwner = previousCalendarOwner.current;
    previousCalendarOwner.current = calendarOwner;

    if (endedOwner !== null && endedOwner !== calendarOwner) {
      void calendarLinkStorage.clear(endedOwner).catch(() => undefined);
    }
  }, [calendarOwner]);

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
