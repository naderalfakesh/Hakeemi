import { getLocales } from 'expo-localization';

import {
  defaultAppPreferences,
  resolveSupportedLocale,
  type AppPreferences,
} from '../domain/preferences';

export function getDevicePreferences(): AppPreferences {
  return {
    ...defaultAppPreferences,
    locale: resolveSupportedLocale(getLocales().map((locale) => locale.languageCode)),
  };
}
