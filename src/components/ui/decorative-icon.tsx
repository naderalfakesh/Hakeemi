import Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps } from 'react';

export type DecorativeIconName = ComponentProps<typeof Ionicons>['name'];

type DecorativeIconProps = Omit<
  ComponentProps<typeof Ionicons>,
  'accessibilityElementsHidden' | 'importantForAccessibility'
>;

export function DecorativeIcon(props: DecorativeIconProps) {
  return <Ionicons accessibilityElementsHidden importantForAccessibility="no" {...props} />;
}
