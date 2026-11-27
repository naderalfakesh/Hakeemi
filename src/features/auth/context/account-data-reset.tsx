import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';

import {
  calendarLinkOwner,
  calendarLinkStorage,
} from '@/features/appointments/data/calendar-link-storage';
import { appointmentQueryKeys } from '@/features/appointments/data/query-keys';
import { useBookingDraft } from '@/features/booking/context/booking-draft-provider';
import { demoSavedProvidersRepository } from '@/features/care/data/demo-saved-providers-repository';
import { savedProvidersQueryKeys } from '@/features/care/hooks/use-saved-providers';

import { useAuthSession } from './auth-session-provider';

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

  useEffect(() => {
    const endedOwner = previousCalendarOwner.current;
    previousCalendarOwner.current = calendarOwner;

    if (endedOwner !== null && endedOwner !== calendarOwner) {
      void calendarLinkStorage.clear(endedOwner).catch(() => undefined);

      if (endedOwner === 'demo') {
        void demoSavedProvidersRepository.reset().catch(() => undefined);
        queryClient.removeQueries({ queryKey: savedProvidersQueryKeys.owner('demo') });
      }
    }
  }, [calendarOwner, queryClient]);

  useEffect(() => {
    const endedAccountId = previousAccountId.current;
    previousAccountId.current = accountId;

    // Ignore anonymous -> signed-in transitions so pre-sign-in booking drafts survive.
    if (endedAccountId === null || endedAccountId === accountId) {
      return;
    }

    // Remove (not invalidate) so in-flight responses for the previous account are dropped.
    queryClient.removeQueries({ queryKey: appointmentQueryKeys.account(endedAccountId) });
    queryClient.removeQueries({ queryKey: savedProvidersQueryKeys.owner(endedAccountId) });
    void clearBookingDraft();
  }, [accountId, clearBookingDraft, queryClient]);

  return null;
}
