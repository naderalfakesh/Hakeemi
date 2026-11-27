import type { AppLocale } from './locale-provider';
import { toIntlLocale } from './locale-provider';

type PluralLabels = Partial<Record<Intl.LDMLPluralRule, string>> & {
  other: string;
};

// Hermes lacks Intl.PluralRules; mirror CLDR rules for ar/en directly.
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

  // Arabic singular/dual forms already encode quantity (avoid "2 طبيبان").
  if (locale === 'ar' && categoryLabel && (category === 'one' || category === 'two')) {
    return label;
  }

  return `${count} ${label}`;
}

// Avoid formatToParts: Hermes on iOS tags only the first word of multi-word time zones.
export function formatTimeZoneName(
  timeZone: string,
  locale: AppLocale,
  at: Date | string = new Date(),
) {
  try {
    const intlLocale = toIntlLocale(locale);
    const instant = typeof at === 'string' ? new Date(at) : at;
    const year = new Intl.DateTimeFormat(intlLocale, { timeZone, year: 'numeric' }).format(instant);
    const yearWithName = new Intl.DateTimeFormat(intlLocale, {
      timeZone,
      timeZoneName: 'long',
      year: 'numeric',
    }).format(instant);
    const name = yearWithName.replace(year, '').replace(EDGE_SEPARATORS, '');

    return name || timeZone;
  } catch {
    return timeZone;
  }
}

const EDGE_SEPARATORS = /^[\s,،\u200e\u200f]+|[\s,،\u200e\u200f]+$/gu;
