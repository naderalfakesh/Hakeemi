import { z } from 'zod';

import type { ProviderPageCursor } from '../domain/repository';
import type { Provider } from '../domain/types';

const providerCursorSchema = z.tuple([z.boolean(), z.string().min(1), z.string().min(1)]);

export function createProviderCursor(
  provider: Pick<Provider, 'displayName' | 'id' | 'isFeatured'>,
): ProviderPageCursor {
  return JSON.stringify([provider.isFeatured, provider.displayName, provider.id]);
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

  const nameComparison = provider.displayName.localeCompare(displayName);

  return nameComparison === 0 ? provider.id.localeCompare(id) : nameComparison;
}
