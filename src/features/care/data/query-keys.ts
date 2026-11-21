import type { AppDataScope } from '@/services/query/data-scope';

import type { AvailabilityWindow, ProviderSearch } from '../domain/types';

function normalizedSearch(search: ProviderSearch) {
  return {
    query: search.query?.trim() ?? '',
    specialtyId: search.specialtyId ?? null,
  };
}

export const careQueryKeys = {
  all: ['care'] as const,
  availability: (providerId: string, window: AvailabilityWindow, scope: AppDataScope = 'account') =>
    ['care', scope, 'availability', providerId, window] as const,
  detail: (providerId: string, scope: AppDataScope = 'account') =>
    ['care', scope, 'provider', providerId] as const,
  discovery: (search: ProviderSearch, scope: AppDataScope = 'account') =>
    ['care', scope, 'provider-discovery', normalizedSearch(search)] as const,
  providerSummary: (providerId: string, scope: AppDataScope = 'account') =>
    ['care', scope, 'provider-summary', providerId] as const,
  specialties: (scope: AppDataScope = 'account') => ['care', scope, 'specialties'] as const,
};
