import { getLocales } from 'expo-localization';

import {
  defaultAppPreferences,
  resolveSupportedLocale,
  type AppPreferences,
} from '../domain/preferences';

/**
 * Preferences for someone who has not chosen any: the device language when
 * Hakeemi supports it, and the device appearance.
 */
export function getDevicePreferences(): AppPreferences {
  return {
    ...defaultAppPreferences,
    locale: resolveSupportedLocale(getLocales().map((locale) => locale.languageCode)),
  };
}
