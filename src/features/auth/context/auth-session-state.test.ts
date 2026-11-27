import { authSessionReducer, initialAuthSessionState } from './auth-session-state';

const sampleUser = {
  displayName: 'Lina Haddad',
  email: 'lina@example.test',
  emailVerified: true,
  id: 'user-1',
  photoURL: null,
};

const sampleProfile = {
  displayName: 'Lina Haddad',
  email: 'lina@example.test',
  id: 'user-1',
  locale: 'en' as const,
  photoURL: null,
  role: 'patient' as const,
  theme: 'system' as const,
};

describe('authSessionReducer', () => {
  it('transitions cleanly across authenticated, profile loading, ready, and anonymous states', () => {
    const authenticated = authSessionReducer(initialAuthSessionState, {
      type: 'AUTHENTICATED',
      user: sampleUser,
    });
    expect(authenticated).toEqual({
      profile: null,
      profileError: null,
      profileStatus: 'idle',
      status: 'authenticated',
      user: sampleUser,
    });

    const loading = authSessionReducer(authenticated, { type: 'PROFILE_LOADING' });
    expect(loading.profileStatus).toBe('loading');
    expect(loading.profileError).toBeNull();

    const ready = authSessionReducer(loading, { profile: sampleProfile, type: 'PROFILE_READY' });
    expect(ready.profile).toEqual(sampleProfile);
    expect(ready.profileStatus).toBe('ready');

    const anonymous = authSessionReducer(ready, { type: 'ANONYMOUS' });
    expect(anonymous).toEqual({
      profile: null,
      profileError: null,
      profileStatus: 'idle',
      status: 'anonymous',
      user: null,
    });
  });

  it('clears user and profile when entering demo mode and records profile errors', () => {
    const authenticated = authSessionReducer(initialAuthSessionState, {
      type: 'AUTHENTICATED',
      user: sampleUser,
    });
    const failed = authSessionReducer(authenticated, { code: 'network', type: 'PROFILE_ERROR' });
    expect(failed.profileError).toBe('network');
    expect(failed.profileStatus).toBe('error');

    const demo = authSessionReducer(failed, { type: 'DEMO' });
    expect(demo).toEqual({
      profile: null,
      profileError: null,
      profileStatus: 'idle',
      status: 'demo',
      user: null,
    });
  });
});
