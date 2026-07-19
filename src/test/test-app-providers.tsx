import { QueryClientProvider } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';
import type { ColorSchemeName } from 'react-native';

import { createAppQueryClient } from '@/services/query/query-client';
import { AppThemeProvider } from '@/theme';

export function TestAppProviders({
  children,
  colorScheme = 'light',
}: {
  children: ReactNode;
  colorScheme?: ColorSchemeName;
}) {
  const [queryClient] = useState(() => createAppQueryClient({ gcTime: Infinity, retry: false }));

  return (
    <QueryClientProvider client={queryClient}>
      <AppThemeProvider colorScheme={colorScheme}>{children}</AppThemeProvider>
    </QueryClientProvider>
  );
}
