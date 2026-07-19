import {
  compareProviderToCursor,
  createProviderCursor,
  parseProviderCursor,
} from './provider-cursor';

describe('provider cursor', () => {
  it('round-trips the stable Firestore sort fields', () => {
    const cursor = createProviderCursor({
      displayName: 'Dr. Lina Haddad',
      id: 'lina-haddad',
      isFeatured: true,
    });

    expect(parseProviderCursor(cursor)).toEqual([true, 'Dr. Lina Haddad', 'lina-haddad']);
    expect(
      compareProviderToCursor(
        { displayName: 'Dr. Omar Rahman', id: 'omar-rahman', isFeatured: true },
        cursor,
      ),
    ).toBeGreaterThan(0);
    expect(
      compareProviderToCursor(
        { displayName: 'Dr. Aisha Bello', id: 'aisha-bello', isFeatured: false },
        cursor,
      ),
    ).toBeGreaterThan(0);
  });

  it('rejects malformed opaque cursors', () => {
    expect(() => parseProviderCursor('not-json')).toThrow();
    expect(() => parseProviderCursor(JSON.stringify([true, 'missing-id']))).toThrow();
  });
});
