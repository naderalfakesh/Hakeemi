import { QueryClient } from '@tanstack/react-query';

type QueryClientOptions = {
  gcTime?: number;
  retry?: boolean | number;
};

export function createAppQueryClient({
  gcTime = 30 * 60 * 1_000,
  retry = 1,
}: QueryClientOptions = {}) {
  return new QueryClient({
    defaultOptions: {
      queries: {
        gcTime,
        refetchOnWindowFocus: false,
        retry,
        staleTime: 5 * 60 * 1_000,
      },
    },
  });
}
