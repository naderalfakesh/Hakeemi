import { useCallback, useState } from 'react';

/**
 * Coordinates pull-to-refresh state around an async refresh callback, ensuring
 * the spinner always settles even if the underlying query rejects.
 */
export function usePullToRefresh(onRefresh: () => Promise<unknown>) {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);

    try {
      await onRefresh();
    } finally {
      setIsRefreshing(false);
    }
  }, [onRefresh]);

  return { handleRefresh, isRefreshing };
}
