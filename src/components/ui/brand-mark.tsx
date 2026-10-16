import { useMemo } from 'react';
import { Image, StyleSheet, View } from 'react-native';

import { useAppTheme, type AppTheme } from '@/theme';

// Glyph mark space relative to the tile side. scripts/render-brand-assets.swift
// renders the native splash tile with the same ratio, tilt and corner radius.
const GLYPH_RATIO = 0.78;
const CORNER_RATIO = 0.22;
const TILT = '-5deg';

type BrandMarkProps = {
  size?: number;
  tilted?: boolean;
};

/**
 * The Hakeemi tile: brand-coloured rounded square carrying the H-pulse glyph.
 * Decorative; the adjacent wordmark or heading carries the meaning.
 */
export function BrandMark({ size = 36, tilted = true }: BrandMarkProps) {
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme, size, tilted), [size, theme, tilted]);

  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={styles.tile}
      testID="brand-mark"
    >
      <Image
        resizeMode="contain"
        source={require('../../../assets/images/brand-glyph.png')}
        style={styles.glyph}
      />
    </View>
  );
}

function createStyles(theme: AppTheme, size: number, tilted: boolean) {
  return StyleSheet.create({
    tile: {
      alignItems: 'center',
      backgroundColor: theme.colors.brand,
      borderRadius: size * CORNER_RATIO,
      height: size,
      justifyContent: 'center',
      transform: tilted ? [{ rotate: TILT }] : [],
      width: size,
    },
    glyph: {
      height: size * GLYPH_RATIO,
      tintColor: theme.colors.textInverse,
      width: size * GLYPH_RATIO,
    },
  });
}
