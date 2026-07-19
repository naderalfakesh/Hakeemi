import { createAuthUnavailableError } from '../domain/errors';

export async function bootstrapUserProfile(): Promise<never> {
  throw createAuthUnavailableError();
}
