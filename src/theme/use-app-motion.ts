import { useReducedMotion } from 'react-native-reanimated';

import { motion } from './tokens';

/**
 * Shared motion tokens plus the platform reduce-motion preference so screens
 * and navigators can fall back to instant transitions consistently.
 */
export function useAppMotion() {
  const prefersReducedMotion = useReducedMotion();

  return {
    duration: motion.duration,
    prefersReducedMotion,
    spring: motion.spring,
  } as const;
}
