import type { AppPreferences } from '../domain/preferences';

export function readAppPreferences(): Promise<AppPreferences | null>;
export function writeAppPreferences(preferences: AppPreferences): Promise<void>;
