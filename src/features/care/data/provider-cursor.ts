import { z } from 'zod';

import type { ProviderPageCursor } from '../domain/repository';
import type { Provider } from '../domain/types';

const providerCursorSchema = z.tuple([z.boolean(), z.string().min(1), z.string().min(1)]);

// Cursors always encode the English display name because the Firestore
// composite index orders documents by the plain `displayName` string field.
export function createProviderCursor(
  provider: Pick<Provider, 'displayName' | 'id' | 'isFeatured'>,
): ProviderPageCursor {
  return JSON.stringify([provider.isFeatured, provider.displayName.en, provider.id]);
}

export function parseProviderCursor(cursor: ProviderPageCursor) {
  return providerCursorSchema.parse(JSON.parse(cursor) as unknown);
}

export function compareProviderToCursor(
  provider: Pick<Provider, 'displayName' | 'id' | 'isFeatured'>,
  cursor: ProviderPageCursor,
) {
  const [isFeatured, displayName, id] = parseProviderCursor(cursor);

  if (provider.isFeatured !== isFeatured) {
    return provider.isFeatured ? -1 : 1;
  }

  const nameComparison = provider.displayName.en.localeCompare(displayName);

  return nameComparison === 0 ? provider.id.localeCompare(id) : nameComparison;
}
