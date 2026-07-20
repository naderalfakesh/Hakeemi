import type { SavedProvidersRepository } from './saved-providers-repository';

export const savedProvidersRepository: SavedProvidersRepository = {
  available: false,
  listSavedProviderIds: async () => [],
  removeProvider: async () => undefined,
  saveProvider: async () => undefined,
};
