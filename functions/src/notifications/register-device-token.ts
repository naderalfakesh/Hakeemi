import { createHash } from 'node:crypto';

import { FieldValue, type Firestore } from 'firebase-admin/firestore';
import { HttpsError } from 'firebase-functions/v2/https';

import {
  registerDeviceTokenRequestSchema,
  registerDeviceTokenResultSchema,
  type RegisterDeviceTokenRequest,
  type RegisterDeviceTokenResult,
} from '../appointments/contracts.js';

// Upper bound on enabled registrations of one token that a single
// registration may supersede. Every registration leaves at most one enabled
// record per token, so only records that predate this rule can accumulate; the
// query filters on `enabled` so disabled history never crowds them out.
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

    // A device token belongs to the account that most recently registered it
    // from the device holding it. Presenting the raw token proves possession,
    // so every other account's registration of the same token is disabled in
    // the same transaction. This also covers a previous account whose sign-out
    // never reached the server, and older records that predate this rule.
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
