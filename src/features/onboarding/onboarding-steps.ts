import type { ImageSourcePropType } from 'react-native';

import type { SemanticColors } from '@/theme';

export const onboardingSteps = [
  {
    illustration: require('../../../assets/illustrations/onboarding-care.webp'),
    key: 'intro',
    surface: 'successSoft',
  },
  {
    illustration: require('../../../assets/illustrations/onboarding-discover.webp'),
    key: 'journey',
    surface: 'infoSoft',
  },
  {
    illustration: require('../../../assets/illustrations/state-booking-confirmed.webp'),
    key: 'permissions',
    surface: 'successSoft',
  },
] as const satisfies readonly {
  illustration: ImageSourcePropType;
  key: 'intro' | 'journey' | 'permissions';
  surface: keyof SemanticColors;
}[];

export type OnboardingStepKey = (typeof onboardingSteps)[number]['key'];
