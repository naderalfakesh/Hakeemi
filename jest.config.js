module.exports = {
  preset: 'jest-expo',
  collectCoverageFrom: ['src/**/*.{ts,tsx}', '!src/app/**/_layout.tsx'],
  resolver: 'react-native-worklets/jest/resolver.js',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testPathIgnorePatterns: ['/dist/', '/firebase/tests/'],
};
