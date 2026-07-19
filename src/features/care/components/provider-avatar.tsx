import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText, type TextTone } from '@/components/ui';
import { useAppTheme, type AppTheme } from '@/theme';

type ProviderAvatarSize = 'large' | 'medium' | 'small';

type ProviderAvatarProps = {
  name: string;
  providerId: string;
  size?: ProviderAvatarSize;
};

export function ProviderAvatar({ name, providerId, size = 'medium' }: ProviderAvatarProps) {
  const theme = useAppTheme();
  const palette = getPalette(theme, providerId);
  const styles = useMemo(
    () => createStyles(theme, size, palette.background),
    [palette.background, size, theme],
  );
  const initials = name
    .replace(/^Dr\.\s+/u, '')
    .split(/\s+/u)
    .slice(0, 2)
    .map((part) => part[0])
    .join('');

  return (
    <View accessibilityElementsHidden importantForAccessibility="no" style={styles.avatar}>
      <AppText tone={palette.tone} variant={size === 'large' ? 'titleMedium' : 'bodyStrong'}>
        {initials}
      </AppText>
    </View>
  );
}

type AvatarPalette = {
  background: string;
  tone: TextTone;
};

function getPalette(theme: AppTheme, providerId: string): AvatarPalette {
  const palettes: readonly AvatarPalette[] = [
    { background: theme.colors.brandSoft, tone: 'brand' },
    { background: theme.colors.accentSoft, tone: 'danger' },
    { background: theme.colors.infoSoft, tone: 'primary' },
    { background: theme.colors.successSoft, tone: 'success' },
  ];
  const hash = Array.from(providerId).reduce((sum, character) => sum + character.charCodeAt(0), 0);

  return palettes[hash % palettes.length]!;
}

function createStyles(theme: AppTheme, size: ProviderAvatarSize, backgroundColor: string) {
  const dimensions: Record<ProviderAvatarSize, number> = {
    large: 88,
    medium: 64,
    small: 48,
  };
  const dimension = dimensions[size];

  return StyleSheet.create({
    avatar: {
      alignItems: 'center',
      backgroundColor,
      borderRadius: size === 'large' ? theme.radii.xl : theme.radii.lg,
      height: dimension,
      justifyContent: 'center',
      width: dimension,
    },
  });
}
