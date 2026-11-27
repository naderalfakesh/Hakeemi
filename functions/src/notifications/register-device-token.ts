import { createHash } from 'node:crypto';

import { FieldValue, type Firestore } from 'firebase-admin/firestore';
import { HttpsError } from 'firebase-functions/v2/https';

import {
  registerDeviceTokenRequestSchema,
  registerDeviceTokenResultSchema,
  type RegisterDeviceTokenRequest,
  type RegisterDeviceTokenResult,
} from './contracts.js';

const SUPERSEDED_REGISTRATION_LIMIT = 50;

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
    const [snapshot, sameTokenSnapshot] = await Promise.all([
      transaction.get(tokenReference),
      transaction.get(
        firestore
          .collectionGroup('deviceTokens')
          .where('enabled', '==', true)
          .where('token', '==', request.token)
          .limit(SUPERSEDED_REGISTRATION_LIMIT),
      ),
    ]);

    // Disable other accounts' active registrations for the same raw token (possession proof).
    for (const otherSnapshot of sameTokenSnapshot.docs) {
      if (otherSnapshot.ref.path !== tokenReference.path) {
        transaction.update(otherSnapshot.ref, {
          enabled: false,
          updatedAt: FieldValue.serverTimestamp(),
        });
      }
    }

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
