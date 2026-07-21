import AsyncStorage from '@react-native-async-storage/async-storage';

const ONBOARDING_COMPLETION_KEY = '@hakeemi/onboarding-completed-v1';
const COMPLETED_VALUE = 'completed';

export const onboardingStorage = {
  hasCompleted: async () =>
    (await AsyncStorage.getItem(ONBOARDING_COMPLETION_KEY)) === COMPLETED_VALUE,
  markCompleted: () => AsyncStorage.setItem(ONBOARDING_COMPLETION_KEY, COMPLETED_VALUE),
};
