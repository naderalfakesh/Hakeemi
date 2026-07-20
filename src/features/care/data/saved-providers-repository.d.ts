export interface SavedProvidersRepository {
  readonly available: boolean;
  listSavedProviderIds(): Promise<readonly string[]>;
  saveProvider(providerId: string): Promise<void>;
  removeProvider(providerId: string): Promise<void>;
}

export const savedProvidersRepository: SavedProvidersRepository;
