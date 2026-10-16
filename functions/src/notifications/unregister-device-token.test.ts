import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { HttpsError } from 'firebase-functions/v2/https';

import { deriveTokenId } from './register-device-token.js';
import { parseUnregisterDeviceTokenRequest } from './unregister-device-token.js';

describe('unregister device token request parsing', () => {
  it('accepts a raw token with an optional account id and trims it', () => {
    const parsed = parseUnregisterDeviceTokenRequest({
      token: '  fcm-token-for-a-fictional-device-123456  ',
      userId: 'patient-a',
    });

    assert.deepEqual(parsed, {
      token: 'fcm-token-for-a-fictional-device-123456',
      userId: 'patient-a',
    });
    assert.equal(parseUnregisterDeviceTokenRequest({ token: parsed.token }).userId, undefined);
  });

  it('rejects hashes, short tokens, unknown fields, and malformed account ids', () => {
    const invalidRequests: unknown[] = [
      { tokenId: deriveTokenId('fcm-token-for-a-fictional-device-123456') },
      { token: 'too-short' },
      { token: 'fcm-token-for-a-fictional-device-123456', enabled: false },
      { token: 'fcm-token-for-a-fictional-device-123456', userId: '../patient-a' },
      { token: 'fcm-token-for-a-fictional-device-123456', userId: '' },
      null,
      'fcm-token-for-a-fictional-device-123456',
    ];

    for (const request of invalidRequests) {
      assert.throws(
        () => parseUnregisterDeviceTokenRequest(request),
        (error: unknown) => error instanceof HttpsError && error.code === 'invalid-argument',
      );
    }
  });
});
