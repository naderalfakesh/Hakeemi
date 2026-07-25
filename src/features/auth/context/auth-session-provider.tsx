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

import { demoSessionStorage } from '../data/demo-session-storage';
import {
  getCurrentAuthUser,
  observeAuthState,
  signOut as signOutFromFirebase,
} from '../data/firebase-auth';
import { bootstrapUserProfile } from '../data/profile-bootstrap';
import { toAuthActionError } from '../domain/errors';
import type { UserProfile } from '../domain/profile';
import type { AuthUser } from '../domain/types';

export type AuthSessionStatus = 'anonymous' | 'authenticated' | 'demo' | 'restoring';
export type ProfileStatus = 'error' | 'idle' | 'loading' | 'ready';

type AuthSessionContextValue = {
  enterDemo: () => void;
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
  const [status, setStatus] = useState<AuthSessionStatus>('restoring');
  const [user, setUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profileStatus, setProfileStatus] = useState<ProfileStatus>('idle');
  const [profileError, setProfileError] = useState<string | null>(null);
  const profileRequestId = useRef(0);
  const statusRef = useRef<AuthSessionStatus>(status);
  const demoModeRef = useRef(false);

  const updateStatus = useCallback((nextStatus: AuthSessionStatus) => {
    statusRef.current = nextStatus;
    setStatus(nextStatus);
  }, []);

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
        if (statusRef.current === 'demo') {
          return;
        }

        profileRequestId.current += 1;
        setProfile(null);
        setProfileError(null);
        setProfileStatus('idle');
        setUser(null);
        updateStatus('anonymous');
        return;
      }

      demoModeRef.current = false;
      void demoSessionStorage.clear();
      setUser(nextUser);
      updateStatus('authenticated');
      void synchronizeProfile();
    },
    [synchronizeProfile, updateStatus],
  );

  const applyDemo = useCallback(() => {
    demoModeRef.current = true;
    profileRequestId.current += 1;
    setProfile(null);
    setProfileError(null);
    setProfileStatus('idle');
    setUser(null);
    updateStatus('demo');
  }, [updateStatus]);

  useEffect(() => {
    let isActive = true;
    let authState: AuthUser | null | undefined;
    let isDemoRestoreComplete = false;

    const restoreSession = () => {
      if (!isActive || authState === undefined || !isDemoRestoreComplete) {
        return;
      }

      if (authState) {
        applyAuthUser(authState);
      } else if (demoModeRef.current) {
        applyDemo();
      } else {
        applyAuthUser(null);
      }
    };
    const unsubscribe = observeAuthState((nextUser) => {
      authState = nextUser;
      restoreSession();
    });

    void demoSessionStorage
      .isEnabled()
      .then((isEnabled) => {
        demoModeRef.current = isEnabled;
        isDemoRestoreComplete = true;
        restoreSession();
      })
      .catch(() => {
        demoModeRef.current = false;
        isDemoRestoreComplete = true;
        restoreSession();
      });

    return () => {
      isActive = false;
      unsubscribe();
    };
  }, [applyAuthUser, applyDemo]);

  const refreshSession = useCallback(async () => {
    const nextUser = await getCurrentAuthUser();

    if (!nextUser) {
      applyAuthUser(null);
      return;
    }

    setUser(nextUser);
    updateStatus('authenticated');
    await synchronizeProfile();
  }, [applyAuthUser, synchronizeProfile, updateStatus]);

  const retryProfile = useCallback(async () => {
    if (user) {
      await synchronizeProfile();
    }
  }, [synchronizeProfile, user]);

  const signOut = useCallback(async () => {
    demoModeRef.current = false;
    await demoSessionStorage.clear();

    if (statusRef.current !== 'demo') {
      await signOutFromFirebase();
    }

    updateStatus('anonymous');
    applyAuthUser(null);
  }, [applyAuthUser, updateStatus]);

  const enterDemo = useCallback(() => {
    applyDemo();
    void demoSessionStorage.enable();
  }, [applyDemo]);

  const value = useMemo<AuthSessionContextValue>(
    () => ({
      enterDemo,
      profile,
      profileError,
      profileStatus,
      refreshSession,
      retryProfile,
      signOut,
      status,
      user,
    }),
    [
      enterDemo,
      profile,
      profileError,
      profileStatus,
      refreshSession,
      retryProfile,
      signOut,
      status,
      user,
    ],
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
