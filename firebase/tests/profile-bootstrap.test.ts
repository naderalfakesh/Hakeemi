import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';

import { deleteApp, initializeApp, type FirebaseApp } from 'firebase/app';
import {
  connectAuthEmulator,
  createUserWithEmailAndPassword,
  getAuth,
  getIdToken,
  signOut,
  updateProfile,
} from 'firebase/auth';
import { connectFirestoreEmulator, doc, getDoc, getFirestore } from 'firebase/firestore';
import { connectFunctionsEmulator, getFunctions, httpsCallable } from 'firebase/functions';

const PROJECT_ID = 'demo-hakeemi';

let app: FirebaseApp;

before(() => {
  app = initializeApp({
    apiKey: 'demo-key',
    appId: '1:123456789:web:demo',
    projectId: PROJECT_ID,
  });

  connectAuthEmulator(getAuth(app), 'http://127.0.0.1:9099', { disableWarnings: true });
  connectFirestoreEmulator(getFirestore(app), '127.0.0.1', 8080);
  connectFunctionsEmulator(getFunctions(app, 'me-central1'), '127.0.0.1', 5001);
});

after(async () => {
  await deleteApp(app);
});

describe('bootstrapUserProfile callable', () => {
  it('creates one readable server-owned profile and remains safe to repeat', async () => {
    const auth = getAuth(app);
    const credential = await createUserWithEmailAndPassword(
      auth,
      'profile-demo@example.test',
      'password123',
    );
    await updateProfile(credential.user, { displayName: 'Profile Demo' });
    await getIdToken(credential.user, true);

    const callable = httpsCallable(getFunctions(app, 'me-central1'), 'bootstrapUserProfile');
    const first = await callable();
    const second = await callable();

    assert.deepEqual(second.data, first.data);
    assert.deepEqual(first.data, {
      displayName: 'Profile Demo',
      email: 'profile-demo@example.test',
      id: credential.user.uid,
      locale: 'en',
      photoURL: null,
      role: 'patient',
      theme: 'system',
    });

    const snapshot = await getDoc(doc(getFirestore(app), 'users', credential.user.uid));
    assert.equal(snapshot.exists(), true);
    assert.equal(snapshot.data()?.role, 'patient');
    assert.ok(snapshot.data()?.createdAt);

    await signOut(auth);
  });

  it('rejects an unauthenticated invocation', async () => {
    const callable = httpsCallable(getFunctions(app, 'me-central1'), 'bootstrapUserProfile');

    await assert.rejects(callable(), (error: unknown) => {
      return (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        error.code === 'functions/unauthenticated'
      );
    });
  });
});
