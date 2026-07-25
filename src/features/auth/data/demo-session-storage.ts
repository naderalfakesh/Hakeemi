import AsyncStorage from '@react-native-async-storage/async-storage';

const DEMO_SESSION_KEY = '@hakeemi/demo-session/v1';

export const demoSessionStorage = {
  clear: () => AsyncStorage.removeItem(DEMO_SESSION_KEY),
  enable: () => AsyncStorage.setItem(DEMO_SESSION_KEY, 'enabled'),
  async isEnabled() {
    return (await AsyncStorage.getItem(DEMO_SESSION_KEY)) === 'enabled';
  },
};
