import Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps } from 'react';

import { isLayoutRTL } from '@/localization/layout-direction';

export type DecorativeIconName = ComponentProps<typeof Ionicons>['name'];

type DecorativeIconProps = Omit<
  ComponentProps<typeof Ionicons>,
  'accessibilityElementsHidden' | 'importantForAccessibility'
>;

const rtlMirroredIcons: Partial<Record<DecorativeIconName, DecorativeIconName>> = {
  'arrow-back': 'arrow-forward',
  'arrow-back-outline': 'arrow-forward-outline',
  'arrow-forward': 'arrow-back',
  'arrow-forward-outline': 'arrow-back-outline',
  'chevron-back': 'chevron-forward',
  'chevron-back-outline': 'chevron-forward-outline',
  'chevron-forward': 'chevron-back',
  'chevron-forward-outline': 'chevron-back-outline',
};

function resolveDirectionalIcon(name: DecorativeIconProps['name']) {
  if (!isLayoutRTL()) {
    return name;
  }

  return rtlMirroredIcons[name] ?? name;
}

export function DecorativeIcon({ name, ...props }: DecorativeIconProps) {
  return (
    <Ionicons
      accessibilityElementsHidden
      importantForAccessibility="no"
      name={resolveDirectionalIcon(name)}
      {...props}
    />
  );
}
