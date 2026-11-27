import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
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
import type { AuthFailureCode, AuthUser } from '../domain/types';
import {
  authSessionReducer,
  initialAuthSessionState,
  type AuthSessionStatus,
  type ProfileStatus,
} from './auth-session-state';

export type { AuthSessionStatus, ProfileStatus };

type AuthSessionContextValue = {
  enterDemo: () => void;
  profile: UserProfile | null;
  profileError: AuthFailureCode | null;
  profileStatus: ProfileStatus;
  refreshSession: () => Promise<void>;
  retryProfile: () => Promise<void>;
  signOut: () => Promise<void>;
  status: AuthSessionStatus;
  user: AuthUser | null;
};

const AuthSessionContext = createContext<AuthSessionContextValue | null>(null);

type AuthSessionProviderProps = {
  children: ReactNode;
  // Runs while credentials are still active; errors are ignored so sign-out always finishes.
  onBeforeSignOut?: () => Promise<void>;
};

export function AuthSessionProvider({ children, onBeforeSignOut }: AuthSessionProviderProps) {
  const [state, dispatch] = useReducer(authSessionReducer, initialAuthSessionState);
  const profileRequestId = useRef(0);
  const statusRef = useRef<AuthSessionStatus>(state.status);
  const demoModeRef = useRef(false);

  const synchronizeProfile = useCallback(async () => {
    const requestId = ++profileRequestId.current;
    dispatch({ type: 'PROFILE_LOADING' });

    try {
      const nextProfile = await bootstrapUserProfile();

      if (profileRequestId.current === requestId) {
        dispatch({ profile: nextProfile, type: 'PROFILE_READY' });
      }
    } catch (error) {
      if (profileRequestId.current === requestId) {
        dispatch({ code: toAuthActionError(error).code, type: 'PROFILE_ERROR' });
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
        statusRef.current = 'anonymous';
        dispatch({ type: 'ANONYMOUS' });
        return;
      }

      demoModeRef.current = false;
      void demoSessionStorage.clear();
      statusRef.current = 'authenticated';
      dispatch({ type: 'AUTHENTICATED', user: nextUser });
      void synchronizeProfile();
    },
    [synchronizeProfile],
  );

  const applyDemo = useCallback(() => {
    demoModeRef.current = true;
    profileRequestId.current += 1;
    statusRef.current = 'demo';
    dispatch({ type: 'DEMO' });
  }, []);

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

    statusRef.current = 'authenticated';
    dispatch({ type: 'AUTHENTICATED', user: nextUser });
    await synchronizeProfile();
  }, [applyAuthUser, synchronizeProfile]);

  const retryProfile = useCallback(async () => {
    if (state.user) {
      await synchronizeProfile();
    }
  }, [state.user, synchronizeProfile]);

  const signOut = useCallback(async () => {
    demoModeRef.current = false;
    await demoSessionStorage.clear();

    if (statusRef.current !== 'demo') {
      try {
        await onBeforeSignOut?.();
      } catch {
        // Ignore cleanup errors so sign-out completes.
      }

      await signOutFromFirebase();
    }

    statusRef.current = 'anonymous';
    applyAuthUser(null);
  }, [applyAuthUser, onBeforeSignOut]);

  const enterDemo = useCallback(() => {
    applyDemo();
    void demoSessionStorage.enable();
  }, [applyDemo]);

  const value = useMemo<AuthSessionContextValue>(
    () => ({
      enterDemo,
      profile: state.profile,
      profileError: state.profileError,
      profileStatus: state.profileStatus,
      refreshSession,
      retryProfile,
      signOut,
      status: state.status,
      user: state.user,
    }),
    [enterDemo, refreshSession, retryProfile, signOut, state],
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
