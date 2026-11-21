import type { ImageSourcePropType } from 'react-native';

import type { SemanticColors } from '@/theme';

export const onboardingSteps = [
  { key: 'personalize' },
  {
    illustration: require('../../../assets/illustrations/onboarding-discover.webp'),
    key: 'journey',
    surface: 'infoSoft',
  },
  {
    illustration: require('../../../assets/illustrations/onboarding-care.webp'),
    key: 'permissions',
    surface: 'successSoft',
  },
] as const satisfies readonly {
  illustration?: ImageSourcePropType;
  key: 'journey' | 'permissions' | 'personalize';
  surface?: keyof SemanticColors;
}[];

export type OnboardingStepKey = (typeof onboardingSteps)[number]['key'];
