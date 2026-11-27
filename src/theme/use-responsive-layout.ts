import { useWindowDimensions } from 'react-native';

import { breakpoints } from './tokens';

export type ResponsiveLayout = {
  fontScale: number;
  height: number;
  isCompact: boolean;
  isTablet: boolean;
  stackActions: boolean;
  width: number;
};

/**
 * Derives semantic layout flags from viewport dimensions and accessibility font
 * scale so screens never duplicate raw breakpoint numbers.
 */
export function useResponsiveLayout(): ResponsiveLayout {
  const { fontScale, height, width } = useWindowDimensions();

  return {
    fontScale,
    height,
    isCompact: height < breakpoints.compactHeight,
    isTablet: width >= breakpoints.tabletWidth,
    stackActions: fontScale >= breakpoints.stackedActionFontScale,
    width,
  };
}
