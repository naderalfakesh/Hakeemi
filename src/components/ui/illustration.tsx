import { useMemo } from 'react';
import { Image, StyleSheet, View, type ImageSourcePropType } from 'react-native';

import { useAppTheme, type AppTheme } from '@/theme';

type IllustrationProps = {
  backdrop?: boolean;
  size?: number;
  source: ImageSourcePropType;
};

/**
 * A decorative spot illustration with an optional organic blob backdrop.
 * Hidden from assistive technology; the surrounding copy carries the meaning.
 */
export function Illustration({ backdrop = true, size = 180, source }: IllustrationProps) {
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme, size), [size, theme]);

  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={styles.container}
    >
      {backdrop && <View style={styles.blob} />}
      {backdrop && <View style={styles.blobSmall} />}
      <Image resizeMode="contain" source={source} style={styles.image} />
    </View>
  );
}

function createStyles(theme: AppTheme, size: number) {
  return StyleSheet.create({
    container: {
      alignItems: 'center',
      height: size,
      justifyContent: 'center',
      width: size,
    },
    blob: {
      backgroundColor: theme.colors.brandSoft,
      borderBottomLeftRadius: size * 0.52,
      borderBottomRightRadius: size * 0.38,
      borderTopLeftRadius: size * 0.42,
      borderTopRightRadius: size * 0.55,
      height: size * 0.86,
      position: 'absolute',
      transform: [{ rotate: '-8deg' }],
      width: size * 0.94,
    },
    blobSmall: {
      backgroundColor: theme.colors.accentSoft,
      borderRadius: size * 0.11,
      end: size * 0.02,
      height: size * 0.16,
      position: 'absolute',
      top: size * 0.06,
      transform: [{ rotate: '18deg' }],
      width: size * 0.16,
    },
    image: {
      height: size * 0.92,
      width: size * 0.92,
    },
  });
}
