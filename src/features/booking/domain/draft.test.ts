import { createBookingDraft, restoreBookingDraft } from './draft';

const requestId = '018f47a2-65d1-7b21-9c43-ec2870b39f10';

describe('booking draft', () => {
  it('stores only the safe booking identifiers and broad reason category', () => {
    expect(
      createBookingDraft(
        'lina-haddad',
        'lina-video-early',
        requestId,
        new Date('2026-07-20T08:00:00.000Z'),
      ),
    ).toEqual({
      providerId: 'lina-haddad',
      reasonCategory: null,
      requestId,
      slotId: 'lina-video-early',
      updatedAt: '2026-07-20T08:00:00.000Z',
    });
  });

  it('restores fresh drafts and discards expired or malformed values', () => {
    const draft = createBookingDraft(
      'lina-haddad',
      'lina-video-early',
      requestId,
      new Date('2026-07-20T08:00:00.000Z'),
    );

    expect(restoreBookingDraft(draft, new Date('2026-07-21T07:59:00.000Z'))).toEqual(draft);
    expect(restoreBookingDraft(draft, new Date('2026-07-21T08:01:00.000Z'))).toBeNull();
    expect(restoreBookingDraft({ ...draft, patientNotes: 'not allowed' })).toBeNull();
  });
});
