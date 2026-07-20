import type { ImageSourcePropType } from 'react-native';

export type ProviderArtwork = {
  /** Signature accent used for the avatar ring and tinted backdrop. */
  accent: string;
  source: ImageSourcePropType;
};

/**
 * Bundled fictional portraits keyed by provider ID. Firebase Storage stays
 * behind the billing boundary, so the portfolio ships its catalog artwork with
 * the app; the Firestore `image` field remains the remote-data contract.
 */
const providerArtwork: Record<string, ProviderArtwork> = {
  'aisha-bello': {
    accent: '#A08BC8',
    source: require('../../../../assets/illustrations/avatar-aisha-bello.png'),
  },
  'lina-haddad': {
    accent: '#4FA79B',
    source: require('../../../../assets/illustrations/avatar-lina-haddad.png'),
  },
  'noor-al-mansouri': {
    accent: '#C98A96',
    source: require('../../../../assets/illustrations/avatar-noor-al-mansouri.png'),
  },
  'omar-rahman': {
    accent: '#DD8570',
    source: require('../../../../assets/illustrations/avatar-omar-rahman.png'),
  },
  'priya-menon': {
    accent: '#C7A15E',
    source: require('../../../../assets/illustrations/avatar-priya-menon.png'),
  },
  'samir-nasser': {
    accent: '#6FA7CC',
    source: require('../../../../assets/illustrations/avatar-samir-nasser.png'),
  },
};

export function getProviderArtwork(providerId: string): ProviderArtwork | null {
  return providerArtwork[providerId] ?? null;
}
