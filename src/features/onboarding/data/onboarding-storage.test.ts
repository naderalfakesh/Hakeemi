import AsyncStorage from '@react-native-async-storage/async-storage';

import { onboardingStorage } from './onboarding-storage';

describe('onboardingStorage', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it('distinguishes a fresh install from a completed onboarding flow', async () => {
    await expect(onboardingStorage.hasCompleted()).resolves.toBe(false);

    await onboardingStorage.markCompleted();

    await expect(onboardingStorage.hasCompleted()).resolves.toBe(true);
  });
});
