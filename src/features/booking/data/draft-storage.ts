import AsyncStorage from '@react-native-async-storage/async-storage';

import { restoreBookingDraft, type BookingDraft } from '../domain/draft';

const BOOKING_DRAFT_KEY = '@hakeemi/booking-draft/v1';

export interface BookingDraftStorage {
  clear(): Promise<void>;
  read(): Promise<BookingDraft | null>;
  write(draft: BookingDraft): Promise<void>;
}

export const bookingDraftStorage: BookingDraftStorage = {
  clear: () => AsyncStorage.removeItem(BOOKING_DRAFT_KEY),
  async read() {
    const value = await AsyncStorage.getItem(BOOKING_DRAFT_KEY);

    if (!value) {
      return null;
    }

    try {
      return restoreBookingDraft(JSON.parse(value) as unknown);
    } catch {
      return null;
    }
  },
  write: (draft) => AsyncStorage.setItem(BOOKING_DRAFT_KEY, JSON.stringify(draft)),
};
