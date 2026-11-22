import { appPreferencesSchema, defaultAppPreferences, resolveSupportedLocale } from './preferences';

describe('app preferences', () => {
  it('accepts only supported locale and theme values', () => {
    expect(appPreferencesSchema.parse(defaultAppPreferences)).toEqual(defaultAppPreferences);
    expect(appPreferencesSchema.safeParse({ locale: 'ar', theme: 'dark' }).success).toBe(true);
    expect(appPreferencesSchema.safeParse({ locale: 'tr', theme: 'dark' }).success).toBe(false);
    expect(appPreferencesSchema.safeParse({ locale: 'en', theme: 'sepia' }).success).toBe(false);
  });

  it('follows the first device language the app supports', () => {
    expect(resolveSupportedLocale(['ar', 'en'])).toBe('ar');
    expect(resolveSupportedLocale(['fr', 'AR', 'en'])).toBe('ar');
    expect(resolveSupportedLocale(['en', 'ar'])).toBe('en');
  });

  it('falls back to English when the device has no supported language', () => {
    expect(resolveSupportedLocale(['tr', 'de'])).toBe('en');
    expect(resolveSupportedLocale([null])).toBe('en');
    expect(resolveSupportedLocale([])).toBe('en');
  });
});
