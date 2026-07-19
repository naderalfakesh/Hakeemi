import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { buildUserProfile, reconcileUserProfile } from './profile.js';

describe('user profile bootstrap', () => {
  it('builds safe defaults from an authenticated identity', () => {
    assert.deepEqual(buildUserProfile({ email: ' DEMO@EXAMPLE.TEST ' }), {
      displayName: 'Hakeemi member',
      email: 'demo@example.test',
      locale: 'en',
      photoURL: null,
      role: 'patient',
      theme: 'system',
    });
  });

  it('reconciles a later Auth display name without changing protected defaults', () => {
    assert.deepEqual(
      reconcileUserProfile(
        {
          displayName: 'Hakeemi member',
          email: 'old@example.test',
          locale: 'en',
          role: 'patient',
          theme: 'system',
        },
        { displayName: 'Demo Patient', email: 'demo@example.test' },
      ),
      {
        displayName: 'Demo Patient',
        email: 'demo@example.test',
        locale: 'en',
        photoURL: null,
        role: 'patient',
        theme: 'system',
      },
    );
  });

  it('does not downgrade an existing display name when the token has no name', () => {
    const profile = reconcileUserProfile(
      { displayName: 'Demo Patient', locale: 'ar', theme: 'dark' },
      { email: 'demo@example.test' },
    );

    assert.equal(profile.displayName, 'Demo Patient');
    assert.equal(profile.locale, 'ar');
    assert.equal(profile.theme, 'dark');
  });
});
