const { jest } = require('@jest/globals');

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

jest.mock('expo-network', () => ({
  getNetworkStateAsync: jest.fn(async () => ({ isConnected: true, isInternetReachable: true })),
  useNetworkState: jest.fn(() => ({ isConnected: true, isInternetReachable: true })),
}));

jest.mock('react-native-reanimated', () => {
  const reanimatedMock = require('react-native-reanimated/mock');

  return {
    ...reanimatedMock,
    useReducedMotion: () => false,
  };
});
