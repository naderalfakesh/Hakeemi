import type { AvailabilityWindow, ProviderSearch } from '../domain/types';

export type CareQueryScope = 'account' | 'demo';

function normalizedSearch(search: ProviderSearch) {
  return {
    query: search.query?.trim() ?? '',
    specialtyId: search.specialtyId ?? null,
  };
}

export const careQueryKeys = {
  all: ['care'] as const,
  availability: (
    providerId: string,
    window: AvailabilityWindow,
    scope: CareQueryScope = 'account',
  ) => ['care', scope, 'availability', providerId, window] as const,
  detail: (providerId: string, scope: CareQueryScope = 'account') =>
    ['care', scope, 'provider', providerId] as const,
  discovery: (search: ProviderSearch, scope: CareQueryScope = 'account') =>
    ['care', scope, 'provider-discovery', normalizedSearch(search)] as const,
  specialties: (scope: CareQueryScope = 'account') => ['care', scope, 'specialties'] as const,
};
