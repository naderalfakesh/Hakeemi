import { getApp } from '@react-native-firebase/app';
import { getAuth } from '@react-native-firebase/auth';
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  getFirestore,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
} from '@react-native-firebase/firestore';

import type { SavedProvidersRepository } from './saved-providers-repository';

function getSavedProvidersCollection() {
  const app = getApp();
  const userId = getAuth(app).currentUser?.uid;

  if (!userId) {
    throw new Error('An authenticated account is required to manage saved providers.');
  }

  return collection(getFirestore(app), 'users', userId, 'savedProviders');
}

export class FirestoreSavedProvidersRepository implements SavedProvidersRepository {
  public readonly available = true;

  public async listSavedProviderIds() {
    const snapshot = await getDocs(
      query(getSavedProvidersCollection(), orderBy('savedAt', 'desc')),
    );

    return snapshot.docs.map((savedProvider) => savedProvider.id);
  }

  public async saveProvider(providerId: string) {
    await setDoc(doc(getSavedProvidersCollection(), providerId), {
      providerId,
      savedAt: serverTimestamp(),
    });
  }

  public async removeProvider(providerId: string) {
    await deleteDoc(doc(getSavedProvidersCollection(), providerId));
  }
}

export const savedProvidersRepository: SavedProvidersRepository =
  new FirestoreSavedProvidersRepository();
