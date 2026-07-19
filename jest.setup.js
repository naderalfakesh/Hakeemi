const { jest } = require('@jest/globals');

jest.mock('react-native-reanimated', () => {
  const reanimatedMock = require('react-native-reanimated/mock');

  return {
    ...reanimatedMock,
    useReducedMotion: () => false,
  };
});
