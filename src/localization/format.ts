import type { AppLocale } from './locale-provider';
import { toIntlLocale } from './locale-provider';

type PluralLabels = Partial<Record<Intl.LDMLPluralRule, string>> & {
  other: string;
};

/**
 * Hermes ships without Intl.PluralRules, so native builds mirror the CLDR
 * rules for the two supported locales instead of constructing the missing
 * formatter.
 */
function selectPluralCategory(count: number, locale: AppLocale): Intl.LDMLPluralRule {
  if (typeof Intl.PluralRules === 'function') {
    return new Intl.PluralRules(toIntlLocale(locale)).select(count);
  }

  if (locale === 'ar') {
    if (count === 0) {
      return 'zero';
    }

    if (count === 1) {
      return 'one';
    }

    if (count === 2) {
      return 'two';
    }

    const remainder = count % 100;

    if (remainder >= 3 && remainder <= 10) {
      return 'few';
    }

    if (remainder >= 11 && remainder <= 99) {
      return 'many';
    }

    return 'other';
  }

  return count === 1 ? 'one' : 'other';
}

export function formatLocalizedCount(
  count: number,
  locale: AppLocale,
  labels: { ar: PluralLabels; en: PluralLabels },
) {
  const category = selectPluralCategory(count, locale);
  const categoryLabel = labels[locale][category];
  const label = categoryLabel ?? labels[locale].other;

  // Arabic singular and dual forms already encode the quantity, so a numeral
  // in front of them reads as redundant ("2 طبيبان").
  if (locale === 'ar' && categoryLabel && (category === 'one' || category === 'two')) {
    return label;
  }

  return `${count} ${label}`;
}
