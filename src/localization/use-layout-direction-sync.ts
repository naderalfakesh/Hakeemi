import { useEffect, useRef } from 'react';

import {
  isLayoutDirectionPendingRestart,
  restartToApplyLayoutDirection,
  syncNativeLayoutDirection,
} from './layout-direction';
import type { AppLocale } from './locale-provider';

/**
 * Keeps the native layout direction in step with the selected locale, and
 * reloads the app once a changed locale is persisted so the new direction
 * applies without a manual restart. The persisted RTL flag is already in
 * place by then, so the reloaded instance boots in the right direction.
 */
export function useLayoutDirectionSync(locale: AppLocale, isLocalePersisted: boolean) {
  const hasRequestedRestart = useRef(false);

  useEffect(() => {
    syncNativeLayoutDirection(locale);
  }, [locale]);

  useEffect(() => {
    if (
      !isLocalePersisted ||
      hasRequestedRestart.current ||
      !isLayoutDirectionPendingRestart(locale)
    ) {
      return;
    }

    hasRequestedRestart.current = true;
    void restartToApplyLayoutDirection();
  }, [isLocalePersisted, locale]);
}
