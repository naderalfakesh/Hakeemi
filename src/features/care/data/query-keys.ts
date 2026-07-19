import type { ProviderSearch } from '../domain/types';

function normalizedSearch(search: ProviderSearch) {
  return {
    query: search.query?.trim() ?? '',
    specialtyId: search.specialtyId ?? null,
  };
}

export const careQueryKeys = {
  all: ['care'] as const,
  availability: (providerId: string) => ['care', 'availability', providerId] as const,
  detail: (providerId: string) => ['care', 'provider', providerId] as const,
  discovery: (search: ProviderSearch) =>
    ['care', 'provider-discovery', normalizedSearch(search)] as const,
  specialties: () => ['care', 'specialties'] as const,
};
