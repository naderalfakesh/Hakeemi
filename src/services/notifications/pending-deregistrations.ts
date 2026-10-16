import AsyncStorage from '@react-native-async-storage/async-storage';
import { z } from 'zod';

// A sign-out that could not disable the account's push registration on the
// server (offline, timeout, or server error) is recorded here and retried the
// next time any account is signed in on this device. Only the account id and
// the token hash are stored; the raw token stays with the messaging SDK.
const STORAGE_KEY = '@hakeemi/notification-deregistrations/v1';
const MAX_ENTRIES = 10;

const pendingDeregistrationSchema = z
  .object({
    tokenId: z
      .string()
      .regex(/^[0-9a-f]{64}$/)
      .nullable(),
    userId: z.string().min(1).max(128),
  })
  .strict();

export type PendingNotificationDeregistration = z.infer<typeof pendingDeregistrationSchema>;

// Every read-modify-write goes through one chain: sign-out writes an entry
// outside the registration queue while queued work may be rewriting the list.
let storageQueue: Promise<unknown> = Promise.resolve();

export function readPendingDeregistrations(): Promise<PendingNotificationDeregistration[]> {
  return serialize(readEntries);
}

export function addPendingDeregistration(entry: PendingNotificationDeregistration) {
  return serialize(async () => {
    const entries = (await readEntries()).filter((other) => !isSameEntry(other, entry));

    await writeEntries([...entries, entry].slice(-MAX_ENTRIES));
  });
}

export function removePendingDeregistration(entry: PendingNotificationDeregistration) {
  return serialize(() => removeWhere((other) => isSameEntry(other, entry)));
}

/**
 * A successful registration supersedes any earlier sign-out of the same
 * account on this device, so its pending entries for that token (or with an
 * unknown token) are dropped.
 */
export function removePendingDeregistrationsSupersededBy(userId: string, tokenId: string) {
  return serialize(() =>
    removeWhere(
      (entry) => entry.userId === userId && (entry.tokenId === null || entry.tokenId === tokenId),
    ),
  );
}

function serialize<T>(operation: () => Promise<T>): Promise<T> {
  const run = storageQueue.then(operation, operation);
  storageQueue = run.catch(() => undefined);

  return run;
}

async function readEntries(): Promise<PendingNotificationDeregistration[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    const parsed = z.array(pendingDeregistrationSchema).safeParse(raw ? JSON.parse(raw) : []);

    return parsed.success ? parsed.data : [];
  } catch {
    return [];
  }
}

async function removeWhere(shouldRemove: (entry: PendingNotificationDeregistration) => boolean) {
  const entries = await readEntries();
  const remaining = entries.filter((entry) => !shouldRemove(entry));

  if (remaining.length !== entries.length) {
    await writeEntries(remaining);
  }
}

function isSameEntry(
  left: PendingNotificationDeregistration,
  right: PendingNotificationDeregistration,
) {
  return left.userId === right.userId && left.tokenId === right.tokenId;
}

async function writeEntries(entries: PendingNotificationDeregistration[]) {
  if (entries.length === 0) {
    await AsyncStorage.removeItem(STORAGE_KEY);
    return;
  }

  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}
