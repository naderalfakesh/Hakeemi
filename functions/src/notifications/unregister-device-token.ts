import { FieldValue, type Firestore } from 'firebase-admin/firestore';
import { HttpsError } from 'firebase-functions/v2/https';

import {
  unregisterDeviceTokenRequestSchema,
  unregisterDeviceTokenResultSchema,
  type UnregisterDeviceTokenRequest,
  type UnregisterDeviceTokenResult,
} from '../appointments/contracts.js';
import { deriveTokenId } from './register-device-token.js';

export function parseUnregisterDeviceTokenRequest(input: unknown): UnregisterDeviceTokenRequest {
  const parsedRequest = unregisterDeviceTokenRequestSchema.safeParse(input);

  if (!parsedRequest.success) {
    throw new HttpsError('invalid-argument', 'The notification device details are invalid.');
  }

  return parsedRequest.data;
}

/**
 * Disables one account's registration of a device token. The caller must hold
 * the raw token, which only the device that owns it can present; a hash alone
 * is never enough. The caller may name another account (`userId`) so a device
 * can flush a sign-out that was recorded offline: whoever holds the raw token
 * could already end that account's registration by registering the token
 * under their own account, so this grants nothing new. Only the named account's
 * record for this exact token is touched. The call is idempotent and reports
 * whether this invocation changed anything.
 */
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
