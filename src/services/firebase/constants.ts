export const FIREBASE_FUNCTIONS_REGION = 'me-central1';

export const FIREBASE_EMULATOR_HOSTS = {
  android: '10.0.2.2',
  default: '127.0.0.1',
} as const;

export const FIREBASE_EMULATOR_PORTS = {
  auth: 9099,
  firestore: 8080,
  functions: 5001,
} as const;
