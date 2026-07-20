import * as Crypto from 'expo-crypto';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

import type { AppointmentReasonCategory } from '@/features/appointments/domain/types';

import { bookingDraftStorage, type BookingDraftStorage } from '../data/draft-storage';
import { bookingDraftSchema, createBookingDraft, type BookingDraft } from '../domain/draft';

type BookingDraftStatus = 'error' | 'loading' | 'ready' | 'saving';

type BookingDraftContextValue = {
  clear: () => Promise<void>;
  draft: BookingDraft | null;
  error: string | null;
  selectSlot: (providerId: string, slotId: string) => Promise<BookingDraft>;
  setReasonCategory: (reasonCategory: AppointmentReasonCategory | null) => Promise<void>;
  status: BookingDraftStatus;
};

const BookingDraftContext = createContext<BookingDraftContextValue | null>(null);

export function BookingDraftProvider({
  children,
  createRequestId = Crypto.randomUUID,
  storage = bookingDraftStorage,
}: {
  children: ReactNode;
  createRequestId?: () => string;
  storage?: BookingDraftStorage;
}) {
  const [draft, setDraft] = useState<BookingDraft | null>(null);
  const [status, setStatus] = useState<BookingDraftStatus>('loading');
  const [error, setError] = useState<string | null>(null);
  const draftRef = useRef<BookingDraft | null>(null);

  const applyDraft = useCallback((nextDraft: BookingDraft | null) => {
    draftRef.current = nextDraft;
    setDraft(nextDraft);
  }, []);

  useEffect(() => {
    let isActive = true;

    void storage
      .read()
      .then((storedDraft) => {
        if (isActive) {
          applyDraft(storedDraft);
          setStatus('ready');
        }
      })
      .catch(() => {
        if (isActive) {
          setError('A previous booking draft could not be restored.');
          setStatus('error');
        }
      });

    return () => {
      isActive = false;
    };
  }, [applyDraft, storage]);

  const persist = useCallback(
    async (nextDraft: BookingDraft | null) => {
      applyDraft(nextDraft);
      setError(null);
      setStatus('saving');

      try {
        if (nextDraft) {
          await storage.write(nextDraft);
        } else {
          await storage.clear();
        }

        setStatus('ready');
      } catch {
        setError('Your booking choices could not be saved on this device.');
        setStatus('error');
      }
    },
    [applyDraft, storage],
  );

  const selectSlot = useCallback(
    async (providerId: string, slotId: string) => {
      const currentDraft = draftRef.current;
      const nextDraft =
        currentDraft?.providerId === providerId && currentDraft.slotId === slotId
          ? bookingDraftSchema.parse({ ...currentDraft, updatedAt: new Date().toISOString() })
          : createBookingDraft(providerId, slotId, createRequestId());

      await persist(nextDraft);
      return nextDraft;
    },
    [createRequestId, persist],
  );

  const setReasonCategory = useCallback(
    async (reasonCategory: AppointmentReasonCategory | null) => {
      const currentDraft = draftRef.current;

      if (!currentDraft) {
        return;
      }

      await persist(
        bookingDraftSchema.parse({
          ...currentDraft,
          reasonCategory,
          updatedAt: new Date().toISOString(),
        }),
      );
    },
    [persist],
  );

  const clear = useCallback(() => persist(null), [persist]);
  const value = useMemo<BookingDraftContextValue>(
    () => ({ clear, draft, error, selectSlot, setReasonCategory, status }),
    [clear, draft, error, selectSlot, setReasonCategory, status],
  );

  return <BookingDraftContext.Provider value={value}>{children}</BookingDraftContext.Provider>;
}

export function useBookingDraft() {
  const context = useContext(BookingDraftContext);

  if (!context) {
    throw new Error('useBookingDraft must be used inside BookingDraftProvider.');
  }

  return context;
}
