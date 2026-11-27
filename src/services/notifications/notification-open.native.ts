import { getApp } from '@react-native-firebase/app';
import {
  getInitialNotification,
  getMessaging,
  onNotificationOpenedApp,
} from '@react-native-firebase/messaging';

import { parseAppointmentNotification } from '@/features/notifications/domain/schemas';

let initialAppointmentId: Promise<string | null> | null = null;
let hasDeliveredInitialNotification = false;

/**
 * Listens for notification taps that open an appointment, delivering the
 * cold-launch notification at most once per process so re-subscriptions never
 * reopen it.
 */
export function subscribeToAppointmentNotificationOpen(listener: (appointmentId: string) => void) {
  const messaging = getMessaging(getApp());
  let active = true;
  const unsubscribe = onNotificationOpenedApp(messaging, (message) => {
    const appointmentId = parseAppointmentNotification(message.data);

    if (active && appointmentId) {
      listener(appointmentId);
    }
  });

  initialAppointmentId ??= getInitialNotification(messaging)
    .then((message) => parseAppointmentNotification(message?.data))
    .catch(() => null);
  void initialAppointmentId.then((appointmentId) => {
    if (active && appointmentId && !hasDeliveredInitialNotification) {
      hasDeliveredInitialNotification = true;
      listener(appointmentId);
    }
  });

  return () => {
    active = false;
    unsubscribe();
  };
}
