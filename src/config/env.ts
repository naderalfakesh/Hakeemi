import { z } from 'zod';

const publicEnvironmentSchema = z.object({
  appEnvironment: z.enum(['development', 'preview', 'production']),
});

export function parsePublicEnvironment(appEnvironment: string) {
  const parsedEnvironment = publicEnvironmentSchema.safeParse({ appEnvironment });

  if (!parsedEnvironment.success) {
    const details = parsedEnvironment.error.issues
      .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
      .join('; ');

    throw new Error(`Invalid public environment configuration: ${details}`);
  }

  return Object.freeze(parsedEnvironment.data);
}

export const environment = parsePublicEnvironment(process.env.EXPO_PUBLIC_APP_ENV ?? 'development');
