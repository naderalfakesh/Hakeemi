import { useEffect, useRef } from 'react';

import {
  isLayoutDirectionPendingRestart,
  restartToApplyLayoutDirection,
  syncNativeLayoutDirection,
} from './layout-direction';
import type { AppLocale } from './locale-provider';

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
