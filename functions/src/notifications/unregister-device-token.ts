import { FieldValue, type Firestore } from 'firebase-admin/firestore';
import { HttpsError } from 'firebase-functions/v2/https';

import {
  unregisterDeviceTokenRequestSchema,
  unregisterDeviceTokenResultSchema,
  type UnregisterDeviceTokenRequest,
  type UnregisterDeviceTokenResult,
} from './contracts.js';
import { deriveTokenId } from './register-device-token.js';

export function parseUnregisterDeviceTokenRequest(input: unknown): UnregisterDeviceTokenRequest {
  const parsedRequest = unregisterDeviceTokenRequestSchema.safeParse(input);

  if (!parsedRequest.success) {
    throw new HttpsError('invalid-argument', 'The notification device details are invalid.');
  }

  return parsedRequest.data;
}

// Raw token proves device possession, allowing an offline sign-out flush for another userId.
export async function unregisterDeviceToken(
  firestore: Firestore,
  callerId: string,
  request: UnregisterDeviceTokenRequest,
): Promise<UnregisterDeviceTokenResult> {
  const tokenId = deriveTokenId(request.token);
  const userId = request.userId ?? callerId;
  const tokenReference = firestore.doc(`users/${userId}/deviceTokens/${tokenId}`);

  const disabled = await firestore.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(tokenReference);

    if (
      !snapshot.exists ||
      snapshot.get('token') !== request.token ||
      snapshot.get('enabled') !== true
    ) {
      return false;
    }

    transaction.update(tokenReference, {
      enabled: false,
      updatedAt: FieldValue.serverTimestamp(),
    });
    return true;
  });

  return unregisterDeviceTokenResultSchema.parse({ disabled, tokenId });
}
