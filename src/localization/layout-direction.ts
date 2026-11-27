import { reloadAppAsync } from 'expo';
import { I18nManager, Platform } from 'react-native';

import type { AppLocale } from './locale-provider';

let requestedRTL: boolean | null = null;

export function isLayoutRTL() {
  return I18nManager.isRTL;
}

// Returns true when the native layout direction changed and needs a restart.
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

export async function restartToApplyLayoutDirection(): Promise<boolean> {
  if (Platform.OS === 'web') {
    return false;
  }

  try {
    await reloadAppAsync('layout-direction-change');
    return true;
  } catch {
    return false;
  }
}

export function resetLayoutDirectionSyncForTests() {
  requestedRTL = null;
}
