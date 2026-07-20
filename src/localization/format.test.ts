import { formatLocalizedCount } from './format';

describe('formatLocalizedCount', () => {
  const labels = {
    ar: { one: 'طبيب', other: 'أطباء' },
    en: { one: 'clinician', other: 'clinicians' },
  } as const;

  it('uses the locale plural category for English and Arabic', () => {
    expect(formatLocalizedCount(1, 'en', labels)).toBe('1 clinician');
    expect(formatLocalizedCount(2, 'en', labels)).toBe('2 clinicians');
    expect(formatLocalizedCount(1, 'ar', labels)).toBe('1 طبيب');
    expect(formatLocalizedCount(3, 'ar', labels)).toBe('3 أطباء');
  });
});
