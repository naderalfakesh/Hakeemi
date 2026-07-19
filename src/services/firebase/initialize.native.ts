import { getApp } from '@react-native-firebase/app';
import { connectAuthEmulator, getAuth } from '@react-native-firebase/auth';
import { connectFirestoreEmulator, getFirestore } from '@react-native-firebase/firestore';
import { connectFunctionsEmulator, getFunctions } from '@react-native-firebase/functions';
import { Platform } from 'react-native';

import { environment } from '@/config/env';

const FUNCTIONS_REGION = 'me-central1';

let isConfigured = false;

export function initializeFirebaseServices() {
  if (isConfigured) {
    return;
  }

  isConfigured = true;

  if (!environment.useFirebaseEmulators) {
    return;
  }

  const emulatorHost = Platform.OS === 'android' ? '10.0.2.2' : '127.0.0.1';
  const app = getApp();

  connectAuthEmulator(getAuth(app), `http://${emulatorHost}:9099`, {
    disableWarnings: true,
  });
  connectFirestoreEmulator(getFirestore(app), emulatorHost, 8080);
  connectFunctionsEmulator(getFunctions(app, FUNCTIONS_REGION), emulatorHost, 5001);
}
