import { parsePublicEnvironment, resolvePublicEnvironment } from './env';
import type * as EnvironmentModule from './env';

type EnvironmentModuleType = typeof EnvironmentModule;

const publicVariableNames = [
  'EXPO_PUBLIC_APP_ENV',
  'EXPO_PUBLIC_FIREBASE_PROJECT_ID',
  'EXPO_PUBLIC_USE_FIREBASE_EMULATORS',
] as const;

const developmentDefaults = {
  appEnvironment: 'development',
  firebaseProjectId: 'hakeemi-portfolio-dev',
  useFirebaseEmulators: true,
};

const unsetEnvironment = {
  appEnvironment: undefined,
  firebaseProjectId: undefined,
  useFirebaseEmulators: undefined,
};

describe('public environment', () => {
  it('accepts a known build channel', () => {
    expect(parsePublicEnvironment('preview', 'hakeemi-portfolio-dev', 'false')).toEqual({
      appEnvironment: 'preview',
      firebaseProjectId: 'hakeemi-portfolio-dev',
      useFirebaseEmulators: false,
    });
  });

  it('rejects an unknown build channel', () => {
    expect(() => parsePublicEnvironment('staging', 'hakeemi-portfolio-dev', 'true')).toThrow(
      'Invalid public environment configuration',
    );
  });

  it('rejects malformed Firebase configuration', () => {
    expect(() => parsePublicEnvironment('development', 'Hakeemi Dev', 'yes')).toThrow(
      'Invalid public environment configuration',
    );
  });

  it.each(['preview', 'production'])(
    'rejects the emulator flag on the %s channel',
    (appEnvironment) => {
      expect(() => parsePublicEnvironment(appEnvironment, 'hakeemi-portfolio-dev', 'true')).toThrow(
        `EXPO_PUBLIC_USE_FIREBASE_EMULATORS must be "false" when EXPO_PUBLIC_APP_ENV is "${appEnvironment}"`,
      );
    },
  );
});

describe('development bundle resolution', () => {
  it('defaults to the Emulator Suite when no variable is set', () => {
    expect(resolvePublicEnvironment(unsetEnvironment, true)).toEqual(developmentDefaults);
  });

  it('treats blank variables as unset', () => {
    expect(
      resolvePublicEnvironment(
        { appEnvironment: '', firebaseProjectId: '  ', useFirebaseEmulators: '' },
        true,
      ),
    ).toEqual(developmentDefaults);
  });

  it('fills only the missing variables', () => {
    expect(
      resolvePublicEnvironment({ ...unsetEnvironment, useFirebaseEmulators: 'false' }, true),
    ).toEqual({ ...developmentDefaults, useFirebaseEmulators: false });
  });

  it('still validates explicit values', () => {
    expect(() =>
      resolvePublicEnvironment({ ...unsetEnvironment, appEnvironment: 'staging' }, true),
    ).toThrow('Invalid public environment configuration');
  });

  it('refuses the emulator flag on a non-development channel even in a development bundle', () => {
    expect(() =>
      resolvePublicEnvironment(
        {
          appEnvironment: 'preview',
          firebaseProjectId: 'hakeemi-portfolio-dev',
          useFirebaseEmulators: 'true',
        },
        true,
      ),
    ).toThrow('EXPO_PUBLIC_USE_FIREBASE_EMULATORS must be "false"');
  });
});

describe('release bundle resolution', () => {
  it('fails closed when every variable is missing and names them all', () => {
    expect(() => resolvePublicEnvironment(unsetEnvironment, false)).toThrow(
      `Missing public environment configuration for a release bundle: ${publicVariableNames.join(', ')}`,
    );
  });

  it('fails closed when a single variable is missing', () => {
    expect(() =>
      resolvePublicEnvironment(
        {
          appEnvironment: 'preview',
          firebaseProjectId: 'hakeemi-portfolio-dev',
          useFirebaseEmulators: undefined,
        },
        false,
      ),
    ).toThrow(
      'Missing public environment configuration for a release bundle: EXPO_PUBLIC_USE_FIREBASE_EMULATORS',
    );
  });

  it('fails closed when a variable is blank', () => {
    expect(() =>
      resolvePublicEnvironment(
        { appEnvironment: 'production', firebaseProjectId: '', useFirebaseEmulators: 'false' },
        false,
      ),
    ).toThrow(
      'Missing public environment configuration for a release bundle: EXPO_PUBLIC_FIREBASE_PROJECT_ID',
    );
  });

  it('never applies the development defaults', () => {
    expect(() =>
      resolvePublicEnvironment(
        {
          appEnvironment: 'development',
          firebaseProjectId: undefined,
          useFirebaseEmulators: 'false',
        },
        false,
      ),
    ).toThrow('Missing public environment configuration for a release bundle');
  });

  it('refuses the emulator flag', () => {
    expect(() =>
      resolvePublicEnvironment(
        {
          appEnvironment: 'development',
          firebaseProjectId: 'hakeemi-portfolio-dev',
          useFirebaseEmulators: 'true',
        },
        false,
      ),
    ).toThrow('a release bundle cannot use the Firebase emulators');
  });

  it('rejects invalid values instead of falling back', () => {
    expect(() =>
      resolvePublicEnvironment(
        {
          appEnvironment: 'staging',
          firebaseProjectId: 'hakeemi-portfolio-dev',
          useFirebaseEmulators: 'false',
        },
        false,
      ),
    ).toThrow('Invalid public environment configuration');
  });

  it.each(['preview', 'production'])('accepts a complete %s configuration', (appEnvironment) => {
    expect(
      resolvePublicEnvironment(
        {
          appEnvironment,
          firebaseProjectId: 'hakeemi-portfolio-dev',
          useFirebaseEmulators: 'false',
        },
        false,
      ),
    ).toEqual({
      appEnvironment,
      firebaseProjectId: 'hakeemi-portfolio-dev',
      useFirebaseEmulators: false,
    });
  });

  it('accepts a development channel against a cloud project', () => {
    expect(
      resolvePublicEnvironment(
        {
          appEnvironment: 'development',
          firebaseProjectId: 'hakeemi-portfolio-dev',
          useFirebaseEmulators: 'false',
        },
        false,
      ),
    ).toEqual({ ...developmentDefaults, useFirebaseEmulators: false });
  });
});

describe('environment module load', () => {
  const originalDev = Reflect.get(globalThis, '__DEV__') as unknown;
  const originalValues = new Map(publicVariableNames.map((name) => [name, process.env[name]]));

  function setBundleGlobal(value: boolean | undefined) {
    if (value === undefined) {
      Reflect.deleteProperty(globalThis, '__DEV__');
      return;
    }

    Reflect.set(globalThis, '__DEV__', value);
  }

  function setProcessEnvironment(
    values: Partial<Record<(typeof publicVariableNames)[number], string>>,
  ) {
    for (const name of publicVariableNames) {
      const value = values[name];

      if (value === undefined) {
        delete process.env[name];
      } else {
        process.env[name] = value;
      }
    }
  }

  function loadEnvironment() {
    let loaded: EnvironmentModuleType | undefined;

    jest.isolateModules(() => {
      loaded = jest.requireActual<EnvironmentModuleType>('./env');
    });

    return loaded!.environment;
  }

  afterEach(() => {
    setBundleGlobal(originalDev as boolean | undefined);

    for (const [name, value] of originalValues) {
      if (value === undefined) {
        delete process.env[name];
      } else {
        process.env[name] = value;
      }
    }
  });

  it('defaults a development bundle to the Emulator Suite without a .env file', () => {
    setBundleGlobal(true);
    setProcessEnvironment({});

    expect(loadEnvironment()).toEqual(developmentDefaults);
  });

  it('throws at load in a release bundle without variables', () => {
    setBundleGlobal(false);
    setProcessEnvironment({});

    expect(loadEnvironment).toThrow(
      'Missing public environment configuration for a release bundle',
    );
  });

  it('treats an undefined __DEV__ as a release bundle', () => {
    setBundleGlobal(undefined);
    setProcessEnvironment({});

    expect(loadEnvironment).toThrow(
      'Missing public environment configuration for a release bundle',
    );
  });

  it('throws at load in a release bundle that asks for the emulators', () => {
    setBundleGlobal(false);
    setProcessEnvironment({
      EXPO_PUBLIC_APP_ENV: 'development',
      EXPO_PUBLIC_FIREBASE_PROJECT_ID: 'hakeemi-portfolio-dev',
      EXPO_PUBLIC_USE_FIREBASE_EMULATORS: 'true',
    });

    expect(loadEnvironment).toThrow('a release bundle cannot use the Firebase emulators');
  });

  it('loads the preview profile values in a release bundle', () => {
    setBundleGlobal(false);
    setProcessEnvironment({
      EXPO_PUBLIC_APP_ENV: 'preview',
      EXPO_PUBLIC_FIREBASE_PROJECT_ID: 'hakeemi-portfolio-dev',
      EXPO_PUBLIC_USE_FIREBASE_EMULATORS: 'false',
    });

    expect(loadEnvironment()).toEqual({
      appEnvironment: 'preview',
      firebaseProjectId: 'hakeemi-portfolio-dev',
      useFirebaseEmulators: false,
    });
  });
});
