import { createHash } from 'node:crypto';

import { FieldValue, type Firestore } from 'firebase-admin/firestore';
import { HttpsError } from 'firebase-functions/v2/https';

import {
  registerDeviceTokenRequestSchema,
  registerDeviceTokenResultSchema,
  type RegisterDeviceTokenRequest,
  type RegisterDeviceTokenResult,
} from '../appointments/contracts.js';

export function parseRegisterDeviceTokenRequest(input: unknown): RegisterDeviceTokenRequest {
  const parsedRequest = registerDeviceTokenRequestSchema.safeParse(input);

  if (!parsedRequest.success) {
    throw new HttpsError('invalid-argument', 'The notification device details are invalid.');
  }

  return parsedRequest.data;
}

export async function registerDeviceToken(
  firestore: Firestore,
  userId: string,
  request: RegisterDeviceTokenRequest,
): Promise<RegisterDeviceTokenResult> {
  const tokenId = deriveTokenId(request.token);
  const tokenReference = firestore.doc(`users/${userId}/deviceTokens/${tokenId}`);

  await firestore.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(tokenReference);

    if (snapshot.exists) {
      transaction.update(tokenReference, {
        enabled: request.enabled,
        locale: request.locale,
        platform: request.platform,
        token: request.token,
        updatedAt: FieldValue.serverTimestamp(),
      });
      return;
    }

    transaction.create(tokenReference, {
      enabled: request.enabled,
      locale: request.locale,
      platform: request.platform,
      token: request.token,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
  });

  return registerDeviceTokenResultSchema.parse({ enabled: request.enabled, tokenId });
}

export function deriveTokenId(token: string) {
  return createHash('sha256').update(token).digest('hex');
}
