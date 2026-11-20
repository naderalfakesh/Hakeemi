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

/**
 * Names a time zone the way people read it ("Gulf Standard Time",
 * "توقيت الخليج") instead of its IANA id ("Asia/Dubai"). The instant matters
 * for zones with daylight saving time, so pass the appointment's start. An
 * engine without time zone names keeps the id rather than failing the screen.
 *
 * The name is what the time zone option adds to a formatted year. Hermes on
 * iOS splits a multi-word name across formatToParts and tags only its first
 * word ("Gulf") as the time zone, so the parts cannot be trusted there.
 */
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
