import { useLocalSearchParams, type Href } from 'expo-router';

import type { AuthSessionStatus } from '@/features/auth/context/auth-session-provider';
import type { AuthUser } from '@/features/auth/domain/types';
import { firstParam } from '@/navigation/route-params';

/** The provider and slot a booking is for. */
export type BookingTarget = {
  providerId: string;
  slotId: string;
};

/**
 * A booking interrupted by sign-in or email verification. The auth routes
 * carry it in their params so the visitor lands back on the same slot.
 */
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

/** Reads the interrupted booking, if any, from the current auth route. */
export function useBookingReturn() {
  const bookingReturn = readBookingReturn(useLocalSearchParams<BookingReturnParams>());

  return { bookingReturn, returnParams: bookingReturnParams(bookingReturn) };
}

/** Reads the provider and slot a booking route was opened for. */
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

/**
 * Booking needs a demo session or a verified account. Returns the auth route
 * that has to come first, carrying the target so the booking resumes after
 * it, or null when the session may book.
 */
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
