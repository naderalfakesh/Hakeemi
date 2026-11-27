import { useCallback, useEffect, useRef, useState } from 'react';
import type { NativeScrollEvent, NativeSyntheticEvent, ScrollViewInstance } from 'react-native';

import { useAppLocale } from '@/localization/locale-provider';
import { useAppMotion } from '@/theme';

type UseOnboardingPagerOptions = {
  pageWidth: number;
  stepCount: number;
};

export function useOnboardingPager({ pageWidth, stepCount }: UseOnboardingPagerOptions) {
  const { isRTL } = useAppLocale();
  const { prefersReducedMotion } = useAppMotion();
  const [activeStep, setActiveStep] = useState(0);
  const scrollViewRef = useRef<ScrollViewInstance>(null);
  const activeStepRef = useRef(activeStep);
  // Native RTL already mirrors horizontal ScrollViews; keep logical order for getPhysicalIndex.
  const isFirstStep = activeStep === 0;
  const isLastStep = activeStep === stepCount - 1;

  const getPhysicalIndex = useCallback(
    (logicalIndex: number) => (isRTL ? stepCount - 1 - logicalIndex : logicalIndex),
    [isRTL, stepCount],
  );
  const showStep = useCallback(
    (logicalIndex: number) => {
      const nextIndex = Math.max(0, Math.min(stepCount - 1, logicalIndex));
      activeStepRef.current = nextIndex;
      setActiveStep(nextIndex);
      scrollViewRef.current?.scrollTo({
        animated: !prefersReducedMotion,
        x: getPhysicalIndex(nextIndex) * pageWidth,
        y: 0,
      });
    },
    [getPhysicalIndex, pageWidth, prefersReducedMotion, stepCount],
  );
  const showPreviousStep = () => showStep(activeStep - 1);
  const showNextStep = () => showStep(activeStep + 1);
  const handleMomentumScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const physicalIndex = Math.max(
      0,
      Math.min(stepCount - 1, Math.round(event.nativeEvent.contentOffset.x / pageWidth)),
    );
    const logicalIndex = isRTL ? stepCount - 1 - physicalIndex : physicalIndex;
    activeStepRef.current = logicalIndex;
    setActiveStep(logicalIndex);
  };

  useEffect(() => {
    scrollViewRef.current?.scrollTo({
      animated: false,
      x: getPhysicalIndex(activeStepRef.current) * pageWidth,
      y: 0,
    });
  }, [getPhysicalIndex, pageWidth]);

  return {
    activeStep,
    isFirstStep,
    isLastStep,
    scrollViewRef,
    initialContentOffset: { x: getPhysicalIndex(0) * pageWidth, y: 0 },
    handleMomentumScrollEnd,
    showNextStep,
    showPreviousStep,
  };
}
