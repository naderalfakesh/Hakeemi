import { z } from 'zod';

export const appPreferencesSchema = z.object({
  locale: z.enum(['en', 'ar']),
  theme: z.enum(['system', 'light', 'dark']),
});

export type AppPreferences = z.infer<typeof appPreferencesSchema>;

export const defaultAppPreferences: AppPreferences = {
  locale: 'en',
  theme: 'system',
};

export function resolveSupportedLocale(
  languageCodes: readonly (string | null)[],
): AppPreferences['locale'] {
  for (const languageCode of languageCodes) {
    const parsed = appPreferencesSchema.shape.locale.safeParse(languageCode?.toLowerCase());

    if (parsed.success) {
      return parsed.data;
    }
  }

  return defaultAppPreferences.locale;
}
