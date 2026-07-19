import type { AppPreferences } from '../domain/preferences';

export async function readAppPreferences(): Promise<null> {
  return null;
}

export async function writeAppPreferences(_preferences: AppPreferences): Promise<never> {
  throw new Error('Synced preferences are available in the iOS and Android portfolio builds.');
}
