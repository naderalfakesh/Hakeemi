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

import { useAuthSession } from '@/features/auth/context/auth-session-provider';
import { useAppPreferences } from '@/features/preferences/context/app-preferences-provider';
import {
  registerForAppointmentNotifications,
  stopNotificationTokenRefresh,
} from '@/services/notifications/notifications';

export type NotificationRegistrationStatus =
  'denied' | 'error' | 'idle' | 'registered' | 'requesting' | 'unavailable';

type NotificationRegistrationContextValue = {
  enable: () => Promise<void>;
  error: string | null;
  status: NotificationRegistrationStatus;
};

const NotificationRegistrationContext = createContext<NotificationRegistrationContextValue | null>(
  null,
);

export function NotificationRegistrationProvider({ children }: { children: ReactNode }) {
  const session = useAuthSession();
  const { preferences } = useAppPreferences();
  const [status, setStatus] = useState<NotificationRegistrationStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const registeredLocale = useRef<typeof preferences.locale | null>(null);
  const [statusUserId, setStatusUserId] = useState<string | null>(null);

  useEffect(() => {
    stopNotificationTokenRefresh();
    registeredLocale.current = null;

    return stopNotificationTokenRefresh;
  }, [session.user?.id]);

  const enable = useCallback(async () => {
    if (!session.user) {
      return;
    }

    setStatusUserId(session.user.id);
    setStatus('requesting');
    setError(null);

    try {
      const result = await registerForAppointmentNotifications({ locale: preferences.locale });
      setStatus(result.status);
      if (result.status === 'registered') {
        registeredLocale.current = preferences.locale;
      }
    } catch {
      setStatus('error');
      setError('Notifications could not be enabled. Try again or check device settings.');
    }
  }, [preferences.locale, session.user]);

  useEffect(() => {
    if (
      status === 'registered' &&
      statusUserId === session.user?.id &&
      registeredLocale.current !== null &&
      registeredLocale.current !== preferences.locale
    ) {
      void enable();
    }
  }, [enable, preferences.locale, session.user?.id, status, statusUserId]);

  const visibleStatus = session.user && statusUserId === session.user.id ? status : 'idle';
  const visibleError = visibleStatus === status ? error : null;
  const value = useMemo(
    () => ({ enable, error: visibleError, status: visibleStatus }),
    [enable, visibleError, visibleStatus],
  );

  return (
    <NotificationRegistrationContext.Provider value={value}>
      {children}
    </NotificationRegistrationContext.Provider>
  );
}

export function useNotificationRegistration() {
  const context = useContext(NotificationRegistrationContext);

  if (!context) {
    throw new Error(
      'useNotificationRegistration must be used inside NotificationRegistrationProvider.',
    );
  }

  return context;
}
