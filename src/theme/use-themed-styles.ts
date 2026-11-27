import { useMemo } from 'react';

import { useAppTheme } from './theme-provider';
import type { AppTheme } from './themes';

export function useThemedStyles<Styles>(createStyles: (theme: AppTheme) => Styles): Styles {
  const theme = useAppTheme();
  return useMemo(() => createStyles(theme), [createStyles, theme]);
}
