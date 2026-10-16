import { z } from 'zod';

const publicEnvironmentSchema = z.object({
  appEnvironment: z.enum(['development', 'preview', 'production']),
  firebaseProjectId: z
    .string()
    .min(1)
    .regex(/^[a-z][a-z0-9-]+$/),
  useFirebaseEmulators: z.enum(['true', 'false']).transform((value) => value === 'true'),
});

export type PublicEnvironment = Readonly<z.infer<typeof publicEnvironmentSchema>>;

export type RawPublicEnvironment = {
  appEnvironment: string | undefined;
  firebaseProjectId: string | undefined;
  useFirebaseEmulators: string | undefined;
};

const publicVariableNames: Record<keyof RawPublicEnvironment, string> = {
  appEnvironment: 'EXPO_PUBLIC_APP_ENV',
  firebaseProjectId: 'EXPO_PUBLIC_FIREBASE_PROJECT_ID',
  useFirebaseEmulators: 'EXPO_PUBLIC_USE_FIREBASE_EMULATORS',
};

// Only a development bundle may fill in missing variables, so a fresh clone
// runs against the Emulator Suite without a .env file. Release bundles get no
// defaults: a missing variable there is a build mistake and must fail closed.
const developmentBundleDefaults: Record<keyof RawPublicEnvironment, string> = {
  appEnvironment: 'development',
  firebaseProjectId: 'hakeemi-portfolio-dev',
  useFirebaseEmulators: 'true',
};

export function parsePublicEnvironment(
  appEnvironment: string,
  firebaseProjectId: string,
  useFirebaseEmulators: string,
): PublicEnvironment {
  const parsedEnvironment = publicEnvironmentSchema.safeParse({
    appEnvironment,
    firebaseProjectId,
    useFirebaseEmulators,
  });

  if (!parsedEnvironment.success) {
    const details = parsedEnvironment.error.issues
      .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
      .join('; ');

    throw new Error(`Invalid public environment configuration: ${details}`);
  }

  if (
    parsedEnvironment.data.useFirebaseEmulators &&
    parsedEnvironment.data.appEnvironment !== 'development'
  ) {
    throw new Error(
      `Invalid public environment configuration: ${publicVariableNames.useFirebaseEmulators} must be "false" when ${publicVariableNames.appEnvironment} is "${parsedEnvironment.data.appEnvironment}"`,
    );
  }

  return Object.freeze(parsedEnvironment.data);
}

function isUnset(value: string | undefined): value is undefined | '' {
  return value === undefined || value.trim() === '';
}

export function resolvePublicEnvironment(
  rawEnvironment: RawPublicEnvironment,
  isDevelopmentBundle: boolean,
): PublicEnvironment {
  const keys = Object.keys(publicVariableNames) as (keyof RawPublicEnvironment)[];
  const missingVariables = keys.filter((key) => isUnset(rawEnvironment[key]));

  if (!isDevelopmentBundle && missingVariables.length > 0) {
    const names = missingVariables.map((key) => publicVariableNames[key]).join(', ');

    throw new Error(
      `Missing public environment configuration for a release bundle: ${names}. Release bundles have no defaults; set every public variable in the EAS build profile or the local environment.`,
    );
  }

  const valueFor = (key: keyof RawPublicEnvironment) => {
    const value = rawEnvironment[key];
    return isUnset(value) ? developmentBundleDefaults[key] : value;
  };

  const parsedEnvironment = parsePublicEnvironment(
    valueFor('appEnvironment'),
    valueFor('firebaseProjectId'),
    valueFor('useFirebaseEmulators'),
  );

  if (!isDevelopmentBundle && parsedEnvironment.useFirebaseEmulators) {
    throw new Error(
      `Invalid public environment configuration: a release bundle cannot use the Firebase emulators; set ${publicVariableNames.useFirebaseEmulators} to "false"`,
    );
  }

  return parsedEnvironment;
}

// Metro defines __DEV__ per bundle: true for development bundles, false for
// release bundles. An undefined global is treated as a release bundle so an
// unexpected runtime fails closed instead of defaulting to the emulators.
const isDevelopmentBundle = typeof __DEV__ === 'boolean' && __DEV__;

export const environment = resolvePublicEnvironment(
  {
    appEnvironment: process.env.EXPO_PUBLIC_APP_ENV,
    firebaseProjectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
    useFirebaseEmulators: process.env.EXPO_PUBLIC_USE_FIREBASE_EMULATORS,
  },
  isDevelopmentBundle,
);
