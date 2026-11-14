import AsyncStorage from '@react-native-async-storage/async-storage';
import { z } from 'zod';

import type { SavedProvidersRepository } from './saved-providers-repository';

const DEMO_SAVED_PROVIDERS_KEY = '@hakeemi/demo-saved-providers/v1';
const savedIdsSchema = z.array(z.string().min(1));

async function readSavedIds(): Promise<string[]> {
  const raw = await AsyncStorage.getItem(DEMO_SAVED_PROVIDERS_KEY);

  if (!raw) {
    return [];
  }

  try {
    const parsed = savedIdsSchema.safeParse(JSON.parse(raw) as unknown);
    return parsed.success ? parsed.data : [];
  } catch {
    return [];
  }
}

export class DemoSavedProvidersRepository implements SavedProvidersRepository {
  public readonly available = true;

  public async listSavedProviderIds() {
    return readSavedIds();
  }

  public async saveProvider(providerId: string) {
    const existing = await readSavedIds();
    const next = [providerId, ...existing.filter((id) => id !== providerId)];
    await AsyncStorage.setItem(DEMO_SAVED_PROVIDERS_KEY, JSON.stringify(next));
  }

  public async removeProvider(providerId: string) {
    const existing = await readSavedIds();
    const next = existing.filter((id) => id !== providerId);
    await AsyncStorage.setItem(DEMO_SAVED_PROVIDERS_KEY, JSON.stringify(next));
  }

  public async reset() {
    await AsyncStorage.removeItem(DEMO_SAVED_PROVIDERS_KEY);
  }
}

export const demoSavedProvidersRepository = new DemoSavedProvidersRepository();
