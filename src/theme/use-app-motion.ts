import { useReducedMotion } from 'react-native-reanimated';

import { motion } from './tokens';

export function useAppMotion() {
  const prefersReducedMotion = useReducedMotion();

  return {
    duration: motion.duration,
    prefersReducedMotion,
    spring: motion.spring,
  } as const;
}
