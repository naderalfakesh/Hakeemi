import type { Provider, ProviderSearch, Specialty } from '../domain/types';

function normalize(value: string) {
  return value
    .normalize('NFKD')
    .replace(/\p{Diacritic}/gu, '')
    .trim()
    .toLocaleLowerCase('en');
}

export function selectProviders(
  providers: readonly Provider[],
  specialties: readonly Specialty[],
  search: ProviderSearch = {},
) {
  const normalizedQuery = normalize(search.query ?? '');
  const specialtyNames = new Map(
    specialties.map(
      (specialty) => [specialty.id, `${specialty.name.en} ${specialty.name.ar}`] as const,
    ),
  );

  return providers
    .filter((provider) => provider.isActive)
    .filter((provider) => !search.specialtyId || provider.specialtyIds.includes(search.specialtyId))
    .filter((provider) => {
      if (!normalizedQuery) {
        return true;
      }

      const searchableValues = [
        provider.displayName.en,
        provider.displayName.ar,
        provider.credentialSummary.en,
        provider.credentialSummary.ar,
        ...provider.languages.flatMap((language) => [language.en, language.ar]),
        ...provider.specialtyIds.map((id) => specialtyNames.get(id) ?? ''),
      ];

      return normalize(searchableValues.join(' ')).includes(normalizedQuery);
    })
    .sort((left, right) => {
      if (left.isFeatured !== right.isFeatured) {
        return left.isFeatured ? -1 : 1;
      }

      return (
        left.displayName.en.localeCompare(right.displayName.en) || left.id.localeCompare(right.id)
      );
    });
}
