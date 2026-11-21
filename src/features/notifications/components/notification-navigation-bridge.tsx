import { useRouter } from 'expo-router';
import { useCallback, useEffect, useRef } from 'react';

import { useAuthSession } from '@/features/auth/context/auth-session-provider';
import { subscribeToAppointmentNotificationOpen } from '@/services/notifications/notifications';

/**
 * Opens the appointment a tapped reminder points at. A reminder opened before
 * the session is authenticated waits until sign-in completes.
 */
export function NotificationNavigationBridge() {
  const router = useRouter();
  const session = useAuthSession();
  const pendingAppointmentId = useRef<string | null>(null);
  // The listener reads the latest status through a ref, so it subscribes once
  // instead of on every session change.
  const sessionStatus = useRef(session.status);

  const openAppointment = useCallback(
    (appointmentId: string) =>
      router.push({ pathname: '/appointments/[appointmentId]', params: { appointmentId } }),
    [router],
  );

  useEffect(() => {
    sessionStatus.current = session.status;
  }, [session.status]);

  useEffect(
    () =>
      subscribeToAppointmentNotificationOpen((appointmentId) => {
        if (sessionStatus.current !== 'authenticated') {
          pendingAppointmentId.current = appointmentId;
          return;
        }

        openAppointment(appointmentId);
      }),
    [openAppointment],
  );

  useEffect(() => {
    if (session.status === 'authenticated' && pendingAppointmentId.current) {
      const appointmentId = pendingAppointmentId.current;
      pendingAppointmentId.current = null;
      openAppointment(appointmentId);
    }
  }, [openAppointment, session.status]);

  return null;
}
