import { getApps, initializeApp } from 'firebase-admin/app';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import { getMessaging } from 'firebase-admin/messaging';
import { HttpsError, onCall } from 'firebase-functions/v2/https';
import { setGlobalOptions } from 'firebase-functions/v2/options';
import { onSchedule } from 'firebase-functions/v2/scheduler';

import { reconcileUserProfile, type AuthIdentity } from './profile.js';
import {
  parseBookAppointmentRequest,
  reserveAppointment,
} from './appointments/book-appointment.js';
import {
  cancelAppointment as cancelAppointmentTransaction,
  parseCancelAppointmentRequest,
  parseRescheduleAppointmentRequest,
  rescheduleAppointment as rescheduleAppointmentTransaction,
} from './appointments/manage-appointments.js';
import {
  parseRegisterDeviceTokenRequest,
  registerDeviceToken as registerDeviceTokenTransaction,
} from './notifications/register-device-token.js';
import { sendAppointmentReminders as deliverAppointmentReminders } from './notifications/send-appointment-reminders.js';

const FUNCTIONS_REGION = 'me-central1';

setGlobalOptions({ maxInstances: 10, region: FUNCTIONS_REGION });

const app = getApps()[0] ?? initializeApp();
const firestore = getFirestore(app);

export const bootstrapUserProfile = onCall(async (request) => {
  const auth = request.auth;

  if (!auth) {
    throw new HttpsError('unauthenticated', 'Sign in before creating a profile.');
  }

  const email = readTokenText(auth.token.email);

  if (!email) {
    throw new HttpsError('failed-precondition', 'The authenticated account has no email.');
  }

  const displayName = readTokenText(auth.token.name);
  const photoURL = readTokenText(auth.token.picture);
  const identity: AuthIdentity = {
    email,
    ...(displayName ? { displayName } : {}),
    ...(photoURL ? { photoURL } : {}),
  };
  const profileReference = firestore.doc(`users/${auth.uid}`);

  const profile = await firestore.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(profileReference);
    const fields = reconcileUserProfile(snapshot.data() ?? {}, identity);

    if (snapshot.exists) {
      transaction.update(profileReference, {
        displayName: fields.displayName,
        email: fields.email,
        photoURL: fields.photoURL,
        updatedAt: FieldValue.serverTimestamp(),
      });
    } else {
      transaction.create(profileReference, {
        ...fields,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
    }

    return { id: auth.uid, ...fields };
  });

  return profile;
});

export const bookAppointment = onCall(async (request) => {
  const auth = request.auth;

  if (!auth) {
    throw new HttpsError('unauthenticated', 'Sign in before booking an appointment.');
  }

  return reserveAppointment(firestore, auth.uid, parseBookAppointmentRequest(request.data));
});

export const cancelAppointment = onCall(async (request) => {
  const auth = request.auth;

  if (!auth) {
    throw new HttpsError('unauthenticated', 'Sign in before cancelling an appointment.');
  }

  return cancelAppointmentTransaction(
    firestore,
    auth.uid,
    parseCancelAppointmentRequest(request.data),
  );
});

export const rescheduleAppointment = onCall(async (request) => {
  const auth = request.auth;

  if (!auth) {
    throw new HttpsError('unauthenticated', 'Sign in before rescheduling an appointment.');
  }

  return rescheduleAppointmentTransaction(
    firestore,
    auth.uid,
    parseRescheduleAppointmentRequest(request.data),
  );
});

export const registerDeviceToken = onCall(async (request) => {
  const auth = request.auth;

  if (!auth) {
    throw new HttpsError('unauthenticated', 'Sign in before enabling notifications.');
  }

  return registerDeviceTokenTransaction(
    firestore,
    auth.uid,
    parseRegisterDeviceTokenRequest(request.data),
  );
});

export const sendAppointmentReminders = onSchedule(
  {
    schedule: 'every 15 minutes',
    timeZone: 'Etc/UTC',
  },
  async () => {
    await deliverAppointmentReminders(firestore, getMessaging());
  },
);

function readTokenText(value: unknown) {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}
