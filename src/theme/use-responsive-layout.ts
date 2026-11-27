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
