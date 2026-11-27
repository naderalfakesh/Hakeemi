import { useCallback, useState } from 'react';

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
