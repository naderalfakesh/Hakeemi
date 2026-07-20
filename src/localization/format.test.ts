import { formatLocalizedCount } from './format';

describe('formatLocalizedCount', () => {
  const labels = {
    ar: { few: 'أطباء', one: 'طبيب', other: 'طبيب', two: 'طبيبان' },
    en: { one: 'clinician', other: 'clinicians' },
  } as const;

  it('uses the locale plural category for English and Arabic', () => {
    expect(formatLocalizedCount(1, 'en', labels)).toBe('1 clinician');
    expect(formatLocalizedCount(2, 'en', labels)).toBe('2 clinicians');
    expect(formatLocalizedCount(3, 'ar', labels)).toBe('3 أطباء');
  });

  it('drops the numeral for Arabic singular and dual forms', () => {
    expect(formatLocalizedCount(1, 'ar', labels)).toBe('طبيب');
    expect(formatLocalizedCount(2, 'ar', labels)).toBe('طبيبان');
  });

  it('keeps the numeral when no dedicated dual label exists', () => {
    const partial = {
      ar: { other: 'أطباء' },
      en: { other: 'clinicians' },
    } as const;

    expect(formatLocalizedCount(2, 'ar', partial)).toBe('2 أطباء');
  });

  it('matches Intl plural selection when Intl.PluralRules is unavailable (Hermes)', () => {
    const counts = [0, 1, 2, 3, 10, 11, 25, 99, 100, 102, 111, 184, 200];
    const withIntl = counts.map((count) => [
      formatLocalizedCount(count, 'ar', labels),
      formatLocalizedCount(count, 'en', labels),
    ]);

    const intlWithOptionalPluralRules = Intl as {
      PluralRules?: (typeof globalThis.Intl)['PluralRules'];
    };
    const originalPluralRules = Intl.PluralRules;
    delete intlWithOptionalPluralRules.PluralRules;

    try {
      const withFallback = counts.map((count) => [
        formatLocalizedCount(count, 'ar', labels),
        formatLocalizedCount(count, 'en', labels),
      ]);

      expect(withFallback).toEqual(withIntl);
    } finally {
      intlWithOptionalPluralRules.PluralRules = originalPluralRules;
    }
  });
});
