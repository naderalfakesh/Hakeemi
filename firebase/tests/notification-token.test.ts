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
const TEST_PASSWORD = 'portfolio-test-password';
const SHARED_DEVICE_TOKEN = 'fcm-token-for-a-shared-fictional-device-123456';

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

describe('device token sign-out lifecycle', () => {
  it('disables only the caller registration on sign-out and stays idempotent', async () => {
    const user = await createAccount('sign-out');
    const register = httpsCallable(getFunctions(app, FUNCTION_REGION), 'registerDeviceToken');
    const unregister = httpsCallable(getFunctions(app, FUNCTION_REGION), 'unregisterDeviceToken');
    const otherToken = 'fcm-token-for-another-fictional-device-123456';

    await register({ enabled: true, locale: 'en', platform: 'ios', token: SHARED_DEVICE_TOKEN });
    await register({ enabled: true, locale: 'en', platform: 'ios', token: otherToken });

    const first = await unregister({ token: SHARED_DEVICE_TOKEN });
    const second = await unregister({ token: SHARED_DEVICE_TOKEN });
    const unknown = await unregister({ token: 'fcm-token-that-was-never-registered-123456' });

    assert.equal((first.data as { disabled: boolean }).disabled, true);
    assert.equal((second.data as { disabled: boolean }).disabled, false);
    assert.equal((unknown.data as { disabled: boolean }).disabled, false);
    assert.deepEqual(await readEnabledTokens(user.uid), [otherToken]);
  });

  it('atomically hands a shared device token from one account to the next, including older records', async () => {
    const previous = await createAccount('previous');
    const register = httpsCallable(getFunctions(app, FUNCTION_REGION), 'registerDeviceToken');
    const previousResult = await register({
      enabled: true,
      locale: 'en',
      platform: 'android',
      token: SHARED_DEVICE_TOKEN,
    });
    const tokenId = (previousResult.data as { tokenId: string }).tokenId;
    const legacyUserId = `legacy-${randomUUID()}`;

    // An older registration that predates the ownership rule: same token, a
    // record id that is not the token hash, and no callable involved.
    await testEnvironment.withSecurityRulesDisabled(async (context) => {
      await context.firestore().doc(`users/${legacyUserId}/deviceTokens/legacy-record`).set({
        createdAt: new Date(),
        enabled: true,
        locale: 'ar',
        platform: 'android',
        token: SHARED_DEVICE_TOKEN,
        updatedAt: new Date(),
      });
    });

    await signOut(getAuth(app));
    const next = await createAccount('next');
    const nextResult = await register({
      enabled: true,
      locale: 'ar',
      platform: 'android',
      token: SHARED_DEVICE_TOKEN,
    });

    assert.equal((nextResult.data as { tokenId: string }).tokenId, tokenId);
    assert.deepEqual(await readEnabledTokens(next.uid), [SHARED_DEVICE_TOKEN]);
    assert.deepEqual(await readEnabledTokens(previous.uid), []);
    assert.deepEqual(await readEnabledTokens(legacyUserId), []);
    await testEnvironment.withSecurityRulesDisabled(async (context) => {
      const previousRecord = await context
        .firestore()
        .doc(`users/${previous.uid}/deviceTokens/${tokenId}`)
        .get();
      assert.equal(previousRecord.data()?.enabled, false);
      assert.equal(previousRecord.data()?.token, SHARED_DEVICE_TOKEN);
    });
  });

  it('still supersedes an enabled older record when many disabled records share the token', async () => {
    // Fifty-plus disabled records of the same token (earlier handovers) sort
    // ahead of one still-enabled older record; the handover must reach it.
    const enabledLegacyUserId = 'z-legacy-enabled';
    await testEnvironment.withSecurityRulesDisabled(async (context) => {
      const firestore = context.firestore();
      const batch = firestore.batch();

      for (let index = 0; index < 60; index += 1) {
        batch.set(
          firestore.doc(`users/a-${String(index).padStart(3, '0')}/deviceTokens/legacy-record`),
          {
            createdAt: new Date(),
            enabled: false,
            locale: 'en',
            platform: 'android',
            token: SHARED_DEVICE_TOKEN,
            updatedAt: new Date(),
          },
        );
      }
      batch.set(firestore.doc(`users/${enabledLegacyUserId}/deviceTokens/legacy-record`), {
        createdAt: new Date(),
        enabled: true,
        locale: 'en',
        platform: 'android',
        token: SHARED_DEVICE_TOKEN,
        updatedAt: new Date(),
      });
      await batch.commit();
    });

    const next = await createAccount('crowded-next');
    const register = httpsCallable(getFunctions(app, FUNCTION_REGION), 'registerDeviceToken');
    await register({
      enabled: true,
      locale: 'en',
      platform: 'android',
      token: SHARED_DEVICE_TOKEN,
    });

    assert.deepEqual(await readEnabledTokens(next.uid), [SHARED_DEVICE_TOKEN]);
    assert.deepEqual(await readEnabledTokens(enabledLegacyUserId), []);
  });

  it('lets the device flush a previous account sign-out only with the raw token, scoped to that account', async () => {
    const previous = await createAccount('offline-previous');
    const register = httpsCallable(getFunctions(app, FUNCTION_REGION), 'registerDeviceToken');
    const unregister = httpsCallable(getFunctions(app, FUNCTION_REGION), 'unregisterDeviceToken');
    await register({ enabled: true, locale: 'en', platform: 'ios', token: SHARED_DEVICE_TOKEN });

    // The previous account signed out offline, so nothing reached the server.
    await signOut(getAuth(app));
    const next = await createAccount('offline-next');
    const nextOwnToken = 'fcm-token-for-the-next-accounts-device-123456';
    await register({ enabled: true, locale: 'en', platform: 'ios', token: nextOwnToken });

    // Knowing the hash is not possession: a different raw token changes nothing.
    const wrongToken = await unregister({
      token: 'fcm-token-guessed-by-someone-else-123456',
      userId: previous.uid,
    });
    assert.equal((wrongToken.data as { disabled: boolean }).disabled, false);
    assert.deepEqual(await readEnabledTokens(previous.uid), [SHARED_DEVICE_TOKEN]);

    // The device still holds the raw token and flushes the pending sign-out.
    const flushed = await unregister({ token: SHARED_DEVICE_TOKEN, userId: previous.uid });
    assert.equal((flushed.data as { disabled: boolean }).disabled, true);
    assert.deepEqual(await readEnabledTokens(previous.uid), []);
    // The flush is scoped to the named account; the caller's own device stays registered.
    assert.deepEqual(await readEnabledTokens(next.uid), [nextOwnToken]);
  });

  it('rejects anonymous and malformed unregister requests', async () => {
    const unregister = httpsCallable(getFunctions(app, FUNCTION_REGION), 'unregisterDeviceToken');

    await assert.rejects(unregister({ token: SHARED_DEVICE_TOKEN }), (error: unknown) =>
      hasFunctionCode(error, 'unauthenticated'),
    );

    await createAccount('malformed-unregister');
    await assert.rejects(unregister({ token: 'too-short' }), (error: unknown) =>
      hasFunctionCode(error, 'invalid-argument'),
    );
    await assert.rejects(unregister({ tokenId: 'a'.repeat(64) }), (error: unknown) =>
      hasFunctionCode(error, 'invalid-argument'),
    );
    await assert.rejects(
      unregister({ token: SHARED_DEVICE_TOKEN, userId: 'users/../../other' }),
      (error: unknown) => hasFunctionCode(error, 'invalid-argument'),
    );
  });
});

async function createAccount(label: string) {
  const credential = await createUserWithEmailAndPassword(
    getAuth(app),
    `${label}-${randomUUID()}@example.test`,
    TEST_PASSWORD,
  );

  return credential.user;
}

async function readEnabledTokens(userId: string) {
  const tokens: string[] = [];

  await testEnvironment.withSecurityRulesDisabled(async (context) => {
    const snapshot = await context
      .firestore()
      .collection(`users/${userId}/deviceTokens`)
      .where('enabled', '==', true)
      .get();

    tokens.push(...snapshot.docs.map((document) => document.get('token') as string));
  });

  return tokens;
}
