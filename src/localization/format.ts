import type { AppLocale } from './locale-provider';

type PluralLabels = Partial<Record<Intl.LDMLPluralRule, string>> & {
  other: string;
};

export function formatLocalizedCount(
  count: number,
  locale: AppLocale,
  labels: { ar: PluralLabels; en: PluralLabels },
) {
  const category = new Intl.PluralRules(locale === 'ar' ? 'ar-AE' : 'en-AE').select(count);
  const label = labels[locale][category] ?? labels[locale].other;
  return `${count} ${label}`;
}
