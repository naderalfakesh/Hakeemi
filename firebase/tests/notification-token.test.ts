import { initializeTestEnvironment, type RulesTestEnvironment } from '@firebase/rules-unit-testing';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { after, before, beforeEach, describe, it } from 'node:test';

import { deleteApp, initializeApp, type FirebaseApp } from 'firebase/app';
import {
  connectAuthEmulator,
  createUserWithEmailAndPassword,
  getAuth,
  signOut,
} from 'firebase/auth';
import { connectFunctionsEmulator, getFunctions, httpsCallable } from 'firebase/functions';

const PROJECT_ID = 'demo-hakeemi';
const FUNCTION_REGION = 'me-central1';

let app: FirebaseApp;
let testEnvironment: RulesTestEnvironment;

before(async () => {
  app = initializeApp({
    apiKey: 'demo-key',
    appId: '1:123456789:web:notification-token-tests',
    projectId: PROJECT_ID,
  });
  connectAuthEmulator(getAuth(app), 'http://127.0.0.1:9099', { disableWarnings: true });
  connectFunctionsEmulator(getFunctions(app, FUNCTION_REGION), '127.0.0.1', 5001);
  testEnvironment = await initializeTestEnvironment({ projectId: PROJECT_ID });
});

beforeEach(async () => {
  if (getAuth(app).currentUser) {
    await signOut(getAuth(app));
  }
  await testEnvironment.clearFirestore();
});

after(async () => {
  await Promise.all([testEnvironment.cleanup(), deleteApp(app)]);
});

describe('device token callable', () => {
  it('stores a normalized token privately and safely replays updates', async () => {
    const user = await createUserWithEmailAndPassword(
      getAuth(app),
      `token-${randomUUID()}@example.test`,
      'portfolio-test-password',
    );
    const token = 'fcm-token-for-a-fictional-device-123456';
    const register = httpsCallable(getFunctions(app, FUNCTION_REGION), 'registerDeviceToken');

    const first = await register({
      enabled: true,
      locale: 'en',
      platform: 'android',
      token,
    });
    const second = await register({
      enabled: false,
      locale: 'ar',
      platform: 'android',
      token,
    });

    assert.equal((first.data as { enabled: boolean }).enabled, true);
    assert.equal((second.data as { enabled: boolean }).enabled, false);
    const tokenId = (first.data as { tokenId: string }).tokenId;

    await testEnvironment.withSecurityRulesDisabled(async (context) => {
      const snapshot = await context
        .firestore()
        .doc(`users/${user.user.uid}/deviceTokens/${tokenId}`)
        .get();
      const data = snapshot.data() as Record<string, unknown>;

      assert.equal(data.token, token);
      assert.equal(data.enabled, false);
      assert.equal(data.locale, 'ar');
      assert.equal(data.platform, 'android');
      assert.ok(data.createdAt);
      assert.ok(data.updatedAt);
    });
  });

  it('rejects anonymous and malformed registration requests', async () => {
    const register = httpsCallable(getFunctions(app, FUNCTION_REGION), 'registerDeviceToken');

    await assert.rejects(
      register({
        enabled: true,
        locale: 'en',
        platform: 'ios',
        token: 'valid-looking-token-123456',
      }),
      (error: unknown) => hasFunctionCode(error, 'unauthenticated'),
    );

    const user = await createUserWithEmailAndPassword(
      getAuth(app),
      `invalid-token-${randomUUID()}@example.test`,
      'portfolio-test-password',
    );
    assert.ok(user.user.uid);
    await assert.rejects(
      register({ enabled: true, locale: 'fr', platform: 'ios', token: 'too-short' }),
      (error: unknown) => hasFunctionCode(error, 'invalid-argument'),
    );
  });
});

function hasFunctionCode(error: unknown, code: string) {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    error.code === `functions/${code}`
  );
}
