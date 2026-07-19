import { QueryClientProvider } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';
import { Platform } from 'react-native';

import { createAppQueryClient } from './query-client';

export function AppQueryProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() =>
    createAppQueryClient({
      gcTime: Platform.OS === 'web' && typeof window === 'undefined' ? Infinity : 30 * 60 * 1_000,
    }),
  );

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
