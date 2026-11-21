import { useMemo } from 'react';

import { useAppTheme } from './theme-provider';
import type { AppTheme } from './themes';

/**
 * Builds a component's stylesheet from the active theme and keeps it until
 * the theme changes. Pass a module-level factory so its identity is stable.
 */
export function useThemedStyles<Styles>(createStyles: (theme: AppTheme) => Styles): Styles {
  const theme = useAppTheme();
  return useMemo(() => createStyles(theme), [createStyles, theme]);
}
