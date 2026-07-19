import { getApp } from '@react-native-firebase/app';
import { getAuth } from '@react-native-firebase/auth';
import {
  doc,
  getDoc,
  getFirestore,
  serverTimestamp,
  setDoc,
} from '@react-native-firebase/firestore';

import { appPreferencesSchema, type AppPreferences } from '../domain/preferences';

function getPreferenceDocument() {
  const app = getApp();
  const userId = getAuth(app).currentUser?.uid;

  if (!userId) {
    throw new Error('An authenticated account is required to access preferences.');
  }

  return doc(getFirestore(app), 'users', userId, 'preferences', 'app');
}

export async function readAppPreferences() {
  const snapshot = await getDoc(getPreferenceDocument());
  return snapshot.exists() ? appPreferencesSchema.parse(snapshot.data()) : null;
}

export async function writeAppPreferences(preferences: AppPreferences) {
  const validatedPreferences = appPreferencesSchema.parse(preferences);

  await setDoc(getPreferenceDocument(), {
    ...validatedPreferences,
    updatedAt: serverTimestamp(),
  });
}
