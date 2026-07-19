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
