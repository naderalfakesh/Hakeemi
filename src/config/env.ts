import { z } from 'zod';

const publicEnvironmentSchema = z.object({
  appEnvironment: z.enum(['development', 'preview', 'production']),
  firebaseProjectId: z
    .string()
    .min(1)
    .regex(/^[a-z][a-z0-9-]+$/),
  useFirebaseEmulators: z.enum(['true', 'false']).transform((value) => value === 'true'),
});

export function parsePublicEnvironment(
  appEnvironment: string,
  firebaseProjectId: string,
  useFirebaseEmulators: string,
) {
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

  return Object.freeze(parsedEnvironment.data);
}

export const environment = parsePublicEnvironment(
  process.env.EXPO_PUBLIC_APP_ENV ?? 'development',
  process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID ?? 'hakeemi-portfolio-dev',
  process.env.EXPO_PUBLIC_USE_FIREBASE_EMULATORS ?? 'true',
);
