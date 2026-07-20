import { I18nManager, Platform } from 'react-native';

import type { AppLocale } from './locale-provider';

let requestedRTL: boolean | null = null;

export function isLayoutRTL() {
  return I18nManager.isRTL;
}

/**
 * Aligns the persisted native layout direction with the selected locale.
 * The native runtime keeps its launch direction, so this returns true while
 * the new direction is pending an app restart.
 */
export function syncNativeLayoutDirection(locale: AppLocale): boolean {
  const shouldBeRTL = locale === 'ar';

  if (Platform.OS === 'web') {
    return false;
  }

  I18nManager.allowRTL(true);

  if ((requestedRTL ?? I18nManager.isRTL) !== shouldBeRTL) {
    I18nManager.forceRTL(shouldBeRTL);
    requestedRTL = shouldBeRTL;
  }

  return I18nManager.isRTL !== shouldBeRTL;
}

export function isLayoutDirectionPendingRestart(locale: AppLocale): boolean {
  if (Platform.OS === 'web') {
    return false;
  }

  return I18nManager.isRTL !== (locale === 'ar');
}

export function resetLayoutDirectionSyncForTests() {
  requestedRTL = null;
}
