import AsyncStorage from '@react-native-async-storage/async-storage';

import { appPreferencesSchema, type AppPreferences } from '../domain/preferences';

const LOCAL_PREFERENCES_KEY = '@hakeemi/app-preferences-v1';

/**
 * Device-local preferences for guest and demo sessions. Signed-in accounts
 * use the synced Firebase copy instead.
 */
export async function readLocalPreferences(): Promise<AppPreferences | null> {
  const raw = await AsyncStorage.getItem(LOCAL_PREFERENCES_KEY);

  if (!raw) {
    return null;
  }

  try {
    const parsed = appPreferencesSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

export function writeLocalPreferences(preferences: AppPreferences): Promise<void> {
  return AsyncStorage.setItem(LOCAL_PREFERENCES_KEY, JSON.stringify(preferences));
}
