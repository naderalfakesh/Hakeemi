import { getApp } from '@react-native-firebase/app';
import { connectAuthEmulator, getAuth } from '@react-native-firebase/auth';
import { connectFirestoreEmulator, getFirestore } from '@react-native-firebase/firestore';
import { connectFunctionsEmulator, getFunctions } from '@react-native-firebase/functions';
import { Platform } from 'react-native';

import { environment } from '@/config/env';

import {
  FIREBASE_EMULATOR_HOSTS,
  FIREBASE_EMULATOR_PORTS,
  FIREBASE_FUNCTIONS_REGION,
} from './constants';

let isConfigured = false;

// Second guard beside env.ts: the Emulator Suite is a development-bundle-only
// target, so a release bundle never connects even if the flag were true.
function shouldConnectToEmulators() {
  return (
    environment.useFirebaseEmulators && environment.appEnvironment === 'development' && __DEV__
  );
}

export function initializeFirebaseServices() {
  if (isConfigured) {
    return;
  }

  isConfigured = true;

  if (!shouldConnectToEmulators()) {
    return;
  }

  const emulatorHost =
    Platform.OS === 'android' ? FIREBASE_EMULATOR_HOSTS.android : FIREBASE_EMULATOR_HOSTS.default;
  const app = getApp();

  connectAuthEmulator(getAuth(app), `http://${emulatorHost}:${FIREBASE_EMULATOR_PORTS.auth}`, {
    disableWarnings: true,
  });
  connectFirestoreEmulator(getFirestore(app), emulatorHost, FIREBASE_EMULATOR_PORTS.firestore);
  connectFunctionsEmulator(
    getFunctions(app, FIREBASE_FUNCTIONS_REGION),
    emulatorHost,
    FIREBASE_EMULATOR_PORTS.functions,
  );
}
