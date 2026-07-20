module.exports = {
  preset: 'jest-expo',
  collectCoverageFrom: ['src/**/*.{ts,tsx}', '!src/app/**/_layout.tsx'],
  moduleNameMapper: {
    '^@/features/appointments/data/appointment-repository$':
      '<rootDir>/src/features/appointments/data/appointment-repository.jest.ts',
    '^@/features/care/data/care-repository$':
      '<rootDir>/src/features/care/data/care-repository.jest.ts',
    '^@/features/care/data/saved-providers-repository$':
      '<rootDir>/src/features/care/data/saved-providers-repository.jest.ts',
  },
  resolver: 'react-native-worklets/jest/resolver.js',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testPathIgnorePatterns: ['/dist/', '/firebase/tests/', '/functions/'],
};
