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
import { Platform } from 'react-native';

import {
  getCurrentAuthUser,
  observeAuthState,
  signOut as signOutFromFirebase,
} from '../data/firebase-auth';
import { bootstrapUserProfile } from '../data/profile-bootstrap';
import { toAuthActionError } from '../domain/errors';
import type { UserProfile } from '../domain/profile';
import type { AuthUser } from '../domain/types';

export type AuthSessionStatus = 'anonymous' | 'authenticated' | 'restoring';
export type ProfileStatus = 'error' | 'idle' | 'loading' | 'ready';

type AuthSessionContextValue = {
  profile: UserProfile | null;
  profileError: string | null;
  profileStatus: ProfileStatus;
  refreshSession: () => Promise<void>;
  retryProfile: () => Promise<void>;
  signOut: () => Promise<void>;
  status: AuthSessionStatus;
  user: AuthUser | null;
};

const AuthSessionContext = createContext<AuthSessionContextValue | null>(null);

export function AuthSessionProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthSessionStatus>(
    Platform.OS === 'web' ? 'anonymous' : 'restoring',
  );
  const [user, setUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profileStatus, setProfileStatus] = useState<ProfileStatus>('idle');
  const [profileError, setProfileError] = useState<string | null>(null);
  const profileRequestId = useRef(0);

  const synchronizeProfile = useCallback(async () => {
    const requestId = ++profileRequestId.current;
    setProfileStatus('loading');
    setProfileError(null);

    try {
      const nextProfile = await bootstrapUserProfile();

      if (profileRequestId.current === requestId) {
        setProfile(nextProfile);
        setProfileStatus('ready');
      }
    } catch (error) {
      if (profileRequestId.current === requestId) {
        setProfileError(toAuthActionError(error).message);
        setProfileStatus('error');
      }
    }
  }, []);

  const applyAuthUser = useCallback(
    (nextUser: AuthUser | null) => {
      if (!nextUser) {
        profileRequestId.current += 1;
        setProfile(null);
        setProfileError(null);
        setProfileStatus('idle');
        setUser(null);
        setStatus('anonymous');
        return;
      }

      setUser(nextUser);
      setStatus('authenticated');
      void synchronizeProfile();
    },
    [synchronizeProfile],
  );

  useEffect(() => observeAuthState(applyAuthUser), [applyAuthUser]);

  const refreshSession = useCallback(async () => {
    const nextUser = await getCurrentAuthUser();

    if (!nextUser) {
      applyAuthUser(null);
      return;
    }

    setUser(nextUser);
    setStatus('authenticated');
    await synchronizeProfile();
  }, [applyAuthUser, synchronizeProfile]);

  const retryProfile = useCallback(async () => {
    if (user) {
      await synchronizeProfile();
    }
  }, [synchronizeProfile, user]);

  const signOut = useCallback(async () => {
    await signOutFromFirebase();
    applyAuthUser(null);
  }, [applyAuthUser]);

  const value = useMemo<AuthSessionContextValue>(
    () => ({
      profile,
      profileError,
      profileStatus,
      refreshSession,
      retryProfile,
      signOut,
      status,
      user,
    }),
    [profile, profileError, profileStatus, refreshSession, retryProfile, signOut, status, user],
  );

  return <AuthSessionContext.Provider value={value}>{children}</AuthSessionContext.Provider>;
}

export function useAuthSession() {
  const context = useContext(AuthSessionContext);

  if (!context) {
    throw new Error('useAuthSession must be used inside AuthSessionProvider.');
  }

  return context;
}
