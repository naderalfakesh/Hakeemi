import { useLocalSearchParams, type Href } from 'expo-router';

import type { AuthSessionStatus } from '@/features/auth/context/auth-session-provider';
import type { AuthUser } from '@/features/auth/domain/types';
import { firstParam } from '@/navigation/route-params';

export type BookingTarget = {
  providerId: string;
  slotId: string;
};

export type BookingReturn = BookingTarget;

type BookingReturnParams = {
  bookingProviderId?: string | string[];
  bookingSlotId?: string | string[];
};

export function readBookingReturn(params: BookingReturnParams): BookingReturn | null {
  const providerId = firstParam(params.bookingProviderId);
  const slotId = firstParam(params.bookingSlotId);

  return providerId && slotId ? { providerId, slotId } : null;
}

export function useBookingReturn() {
  const bookingReturn = readBookingReturn(useLocalSearchParams<BookingReturnParams>());

  return { bookingReturn, returnParams: bookingReturnParams(bookingReturn) };
}

export function useBookingTarget(): BookingTarget {
  const params = useLocalSearchParams<{
    providerId?: string | string[];
    slotId?: string | string[];
  }>();

  return { providerId: firstParam(params.providerId), slotId: firstParam(params.slotId) };
}

export function bookingReturnParams(bookingReturn: BookingReturn | null) {
  return bookingReturn
    ? {
        bookingProviderId: bookingReturn.providerId,
        bookingSlotId: bookingReturn.slotId,
      }
    : {};
}

export function bookingDestination(bookingReturn: BookingReturn | null) {
  return bookingReturn
    ? {
        pathname: '/booking/details' as const,
        params: { providerId: bookingReturn.providerId, slotId: bookingReturn.slotId },
      }
    : ('/home' as const);
}

export function bookingAccessRedirect(
  session: { status: AuthSessionStatus; user: AuthUser | null },
  target: BookingTarget,
): Href | null {
  const params = bookingReturnParams(target);

  if (session.status !== 'authenticated' && session.status !== 'demo') {
    return { pathname: '/auth/sign-in', params };
  }

  if (session.status === 'authenticated' && !session.user?.emailVerified) {
    return { pathname: '/auth/verify-email', params };
  }

  return null;
}
