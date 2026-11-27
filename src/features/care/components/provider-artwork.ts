import type { ImageSourcePropType } from 'react-native';

export type ProviderArtwork = {
  accent: string;
  source: ImageSourcePropType;
};

const providerArtwork: Record<string, ProviderArtwork> = {
  'aisha-bello': {
    accent: '#A08BC8',
    source: require('../../../../assets/illustrations/avatar-aisha-bello.webp'),
  },
  'lina-haddad': {
    accent: '#4FA79B',
    source: require('../../../../assets/illustrations/avatar-lina-haddad.webp'),
  },
  'noor-al-mansouri': {
    accent: '#C98A96',
    source: require('../../../../assets/illustrations/avatar-noor-al-mansouri.webp'),
  },
  'omar-rahman': {
    accent: '#DD8570',
    source: require('../../../../assets/illustrations/avatar-omar-rahman.webp'),
  },
  'priya-menon': {
    accent: '#C7A15E',
    source: require('../../../../assets/illustrations/avatar-priya-menon.webp'),
  },
  'samir-nasser': {
    accent: '#6FA7CC',
    source: require('../../../../assets/illustrations/avatar-samir-nasser.webp'),
  },
};

export function getProviderArtwork(providerId: string): ProviderArtwork | null {
  return providerArtwork[providerId] ?? null;
}
