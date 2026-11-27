import type { UserProfile } from '../domain/profile';
import type { AuthFailureCode, AuthUser } from '../domain/types';

export type AuthSessionStatus = 'anonymous' | 'authenticated' | 'demo' | 'restoring';
export type ProfileStatus = 'error' | 'idle' | 'loading' | 'ready';

export type AuthSessionState = {
  profile: UserProfile | null;
  profileError: AuthFailureCode | null;
  profileStatus: ProfileStatus;
  status: AuthSessionStatus;
  user: AuthUser | null;
};

export type AuthSessionAction =
  | { type: 'ANONYMOUS' }
  | { type: 'AUTHENTICATED'; user: AuthUser }
  | { type: 'DEMO' }
  | { type: 'PROFILE_LOADING' }
  | { profile: UserProfile; type: 'PROFILE_READY' }
  | { code: AuthFailureCode; type: 'PROFILE_ERROR' };

export const initialAuthSessionState: AuthSessionState = {
  profile: null,
  profileError: null,
  profileStatus: 'idle',
  status: 'restoring',
  user: null,
};

export function authSessionReducer(
  state: AuthSessionState,
  action: AuthSessionAction,
): AuthSessionState {
  switch (action.type) {
    case 'ANONYMOUS':
      return {
        profile: null,
        profileError: null,
        profileStatus: 'idle',
        status: 'anonymous',
        user: null,
      };
    case 'DEMO':
      return {
        profile: null,
        profileError: null,
        profileStatus: 'idle',
        status: 'demo',
        user: null,
      };
    case 'AUTHENTICATED':
      return {
        ...state,
        status: 'authenticated',
        user: action.user,
      };
    case 'PROFILE_LOADING':
      return {
        ...state,
        profileError: null,
        profileStatus: 'loading',
      };
    case 'PROFILE_READY':
      return {
        ...state,
        profile: action.profile,
        profileError: null,
        profileStatus: 'ready',
      };
    case 'PROFILE_ERROR':
      return {
        ...state,
        profileError: action.code,
        profileStatus: 'error',
      };
  }
}
