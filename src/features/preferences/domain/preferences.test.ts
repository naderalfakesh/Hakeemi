import { appPreferencesSchema, defaultAppPreferences } from './preferences';

describe('app preferences', () => {
  it('accepts only supported locale and theme values', () => {
    expect(appPreferencesSchema.parse(defaultAppPreferences)).toEqual(defaultAppPreferences);
    expect(appPreferencesSchema.safeParse({ locale: 'ar', theme: 'dark' }).success).toBe(true);
    expect(appPreferencesSchema.safeParse({ locale: 'tr', theme: 'dark' }).success).toBe(false);
    expect(appPreferencesSchema.safeParse({ locale: 'en', theme: 'sepia' }).success).toBe(false);
  });
});
