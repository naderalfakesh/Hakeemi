import { act, renderHook, waitFor } from '@testing-library/react-native';
import type { ReactNode } from 'react';

import type { BookingDraftStorage } from '../data/draft-storage';
import { BookingDraftProvider, useBookingDraft } from './booking-draft-provider';

const firstRequestId = '018f47a2-65d1-7b21-9c43-ec2870b39f10';
const secondRequestId = '018f47a2-65d1-7b21-9c43-ec2870b39f11';

describe('BookingDraftProvider', () => {
  it('preserves a request ID across edits and rotates it for a different slot', async () => {
    const storage: BookingDraftStorage = {
      clear: jest.fn().mockResolvedValue(undefined),
      read: jest.fn().mockResolvedValue(null),
      write: jest.fn().mockResolvedValue(undefined),
    };
    const createRequestId = jest
      .fn()
      .mockReturnValueOnce(firstRequestId)
      .mockReturnValueOnce(secondRequestId);
    const wrapper = ({ children }: { children: ReactNode }) => (
      <BookingDraftProvider createRequestId={createRequestId} storage={storage}>
        {children}
      </BookingDraftProvider>
    );
    const { result } = await renderHook(useBookingDraft, { wrapper });

    await waitFor(() => expect(result.current.status).toBe('ready'));
    await act(async () => result.current.selectSlot('lina-haddad', 'first-slot'));
    await act(async () => result.current.setReasonCategory('follow_up'));
    await act(async () => result.current.selectSlot('lina-haddad', 'first-slot'));

    expect(result.current.draft).toMatchObject({
      reasonCategory: 'follow_up',
      requestId: firstRequestId,
      slotId: 'first-slot',
    });

    await act(async () => result.current.selectSlot('lina-haddad', 'second-slot'));

    expect(result.current.draft).toMatchObject({
      reasonCategory: null,
      requestId: secondRequestId,
      slotId: 'second-slot',
    });
    expect(storage.write).toHaveBeenCalledTimes(4);
  });
});
