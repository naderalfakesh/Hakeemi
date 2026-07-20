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
  const categoryLabel = labels[locale][category];
  const label = categoryLabel ?? labels[locale].other;

  // Arabic singular and dual forms already encode the quantity, so a numeral
  // in front of them reads as redundant ("2 طبيبان").
  if (locale === 'ar' && categoryLabel && (category === 'one' || category === 'two')) {
    return label;
  }

  return `${count} ${label}`;
}
