import type { PublicEnvironment } from '@/config/env';

import type * as InitializerModule from './initialize.native';

type InitializerModuleType = typeof InitializerModule;

type Mutable<T> = { -readonly [K in keyof T]: T[K] };

const mockEnvironment: Mutable<PublicEnvironment> = {
  appEnvironment: 'development',
  firebaseProjectId: 'hakeemi-portfolio-dev',
  useFirebaseEmulators: true,
};

const mockConnectAuthEmulator = jest.fn();
const mockConnectFirestoreEmulator = jest.fn();
const mockConnectFunctionsEmulator = jest.fn();

jest.mock('@/config/env', () => ({ environment: mockEnvironment }));
jest.mock('@react-native-firebase/app', () => ({ getApp: () => ({ name: 'test' }) }));
jest.mock('@react-native-firebase/auth', () => ({
  connectAuthEmulator: mockConnectAuthEmulator,
  getAuth: () => ({ name: 'auth' }),
}));
jest.mock('@react-native-firebase/firestore', () => ({
  connectFirestoreEmulator: mockConnectFirestoreEmulator,
  getFirestore: () => ({ name: 'firestore' }),
}));
jest.mock('@react-native-firebase/functions', () => ({
  connectFunctionsEmulator: mockConnectFunctionsEmulator,
  getFunctions: () => ({ name: 'functions' }),
}));

const originalDev = Reflect.get(globalThis, '__DEV__') as boolean;

// React Native itself reads __DEV__ while loading, so only true/false are
// reachable here; the undefined case is covered by the env module tests.
function setBundleGlobal(value: boolean) {
  Reflect.set(globalThis, '__DEV__', value);
}

// The module keeps an "already configured" flag, so every case loads a fresh copy.
function loadInitializer() {
  let loaded: InitializerModuleType | undefined;

  jest.isolateModules(() => {
    loaded = jest.requireActual<InitializerModuleType>('./initialize.native');
  });

  return loaded!.initializeFirebaseServices;
}

function emulatorConnectionCount() {
  return (
    mockConnectAuthEmulator.mock.calls.length +
    mockConnectFirestoreEmulator.mock.calls.length +
    mockConnectFunctionsEmulator.mock.calls.length
  );
}

beforeEach(() => {
  jest.clearAllMocks();
  mockEnvironment.appEnvironment = 'development';
  mockEnvironment.firebaseProjectId = 'hakeemi-portfolio-dev';
  mockEnvironment.useFirebaseEmulators = true;
  setBundleGlobal(true);
});

afterAll(() => {
  setBundleGlobal(originalDev);
});

describe('initializeFirebaseServices', () => {
  it('connects a development bundle on the development channel to the Emulator Suite once', () => {
    const initializeFirebaseServices = loadInitializer();

    initializeFirebaseServices();
    initializeFirebaseServices();

    expect(mockConnectAuthEmulator).toHaveBeenCalledTimes(1);
    expect(mockConnectAuthEmulator).toHaveBeenCalledWith(
      { name: 'auth' },
      'http://127.0.0.1:9099',
      {
        disableWarnings: true,
      },
    );
    expect(mockConnectFirestoreEmulator).toHaveBeenCalledTimes(1);
    expect(mockConnectFirestoreEmulator).toHaveBeenCalledWith(
      { name: 'firestore' },
      '127.0.0.1',
      8080,
    );
    expect(mockConnectFunctionsEmulator).toHaveBeenCalledTimes(1);
    expect(mockConnectFunctionsEmulator).toHaveBeenCalledWith(
      { name: 'functions' },
      '127.0.0.1',
      5001,
    );
  });

  it('never connects a release bundle, even when the environment asks for the emulators', () => {
    setBundleGlobal(false);

    loadInitializer()();

    expect(emulatorConnectionCount()).toBe(0);
  });

  it.each(['preview', 'production'] as const)(
    'never connects the %s channel, even when the flag is set',
    (appEnvironment) => {
      mockEnvironment.appEnvironment = appEnvironment;

      loadInitializer()();

      expect(emulatorConnectionCount()).toBe(0);
    },
  );

  it('skips the emulators when a development bundle targets the cloud project', () => {
    mockEnvironment.useFirebaseEmulators = false;

    loadInitializer()();

    expect(emulatorConnectionCount()).toBe(0);
  });
});
