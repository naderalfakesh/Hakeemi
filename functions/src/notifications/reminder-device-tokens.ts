import { FieldValue, type Firestore } from 'firebase-admin/firestore';
import { type SendResponse } from 'firebase-admin/messaging';
import { z } from 'zod';

import { shouldDisableDeviceToken } from './reminder-delivery-errors.js';
import { type ReminderLocale, resolveReminderLocale } from './reminder-message.js';

const deviceTokenSchema = z
  .object({
    enabled: z.literal(true),
    locale: z.string().optional(),
    platform: z.enum(['android', 'ios']),
    token: z.string().trim().min(16).max(4096),
  })
  .passthrough();

export type DeviceTokenEntry = {
  locale: ReminderLocale;
  reference: FirebaseFirestore.DocumentReference;
  token: string;
};

export function groupTokensByLocale(tokens: readonly DeviceTokenEntry[]) {
  const groups = new Map<ReminderLocale, DeviceTokenEntry[]>();

  for (const entry of tokens) {
    const group = groups.get(entry.locale);

    if (group) {
      group.push(entry);
    } else {
      groups.set(entry.locale, [entry]);
    }
  }

  return groups;
}

export async function readEnabledTokens(firestore: Firestore, patientId: string) {
  const snapshot = await firestore
    .collection('users')
    .doc(patientId)
    .collection('deviceTokens')
    .where('enabled', '==', true)
    .limit(500)
    .get();

  return snapshot.docs.flatMap<DeviceTokenEntry>((document) => {
    const parsed = deviceTokenSchema.safeParse(document.data());

    return parsed.success
      ? [
          {
            locale: resolveReminderLocale(parsed.data.locale),
            reference: document.ref,
            token: parsed.data.token,
          },
        ]
      : [];
  });
}

export async function disableInvalidTokens(
  firestore: Firestore,
  tokens: readonly DeviceTokenEntry[],
  responses: readonly SendResponse[],
) {
  const batch = firestore.batch();
  let invalidCount = 0;

  responses.forEach((response, index) => {
    const entry = tokens[index];

    if (entry && shouldDisableDeviceToken(response)) {
      batch.update(entry.reference, {
        enabled: false,
        updatedAt: FieldValue.serverTimestamp(),
      });
      invalidCount += 1;
    }
  });

  if (invalidCount > 0) {
    await batch.commit();
  }

  return invalidCount;
}
