export type BookingReturn = {
  providerId: string;
  slotId: string;
};

export function readBookingReturn(params: {
  bookingProviderId?: string | string[];
  bookingSlotId?: string | string[];
}): BookingReturn | null {
  const providerId = readParam(params.bookingProviderId);
  const slotId = readParam(params.bookingSlotId);

  return providerId && slotId ? { providerId, slotId } : null;
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

function readParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? (value[0] ?? '') : (value ?? '');
}
