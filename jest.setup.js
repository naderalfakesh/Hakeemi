const path = require('node:path');
const { jest } = require('@jest/globals');

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

// jest-expo stubs `react-native/asset-registry`, but the `AssetRegistry` export
// of React Native 0.88 reads its private module directly, so assets resolved
// through expo-asset (icon fonts) miss the stub. Route both to the same mock.
jest.mock(
  path.join(
    path.dirname(require.resolve('react-native/package.json')),
    'src/private/assets/AssetRegistry.js',
  ),
  () => ({ AssetRegistry: jest.requireMock('react-native/asset-registry') }),
);

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
