import type { AppLocale } from '@/localization/locale-provider';
import { toIntlLocale } from '@/localization/locale-provider';
import type { LocalizedStrings } from '@/localization/use-strings';

import type { AvailabilitySlot, Money, VisitMode } from '../domain/types';

const formatterStrings: LocalizedStrings<{
  feeOnRequest: string;
  visitMode: Record<VisitMode, string>;
}> = {
  ar: {
    feeOnRequest: 'الرسوم عند الطلب',
    visitMode: {
      in_person: 'زيارة حضورية',
      video: 'زيارة عبر الفيديو',
    },
  },
  en: {
    feeOnRequest: 'Fee on request',
    visitMode: {
      in_person: 'In person',
      video: 'Video visit',
    },
  },
};

export function formatAvailability(slot: AvailabilitySlot, locale: AppLocale = 'en') {
  return new Intl.DateTimeFormat(toIntlLocale(locale), {
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    month: 'short',
    timeZone: slot.timezone,
    weekday: 'short',
  }).format(new Date(slot.startsAt));
}

export function formatFee(fee: Money | null, locale: AppLocale = 'en') {
  if (!fee) {
    return formatterStrings[locale].feeOnRequest;
  }

  return new Intl.NumberFormat(toIntlLocale(locale), {
    currency: fee.currency,
    maximumFractionDigits: 0,
    style: 'currency',
  }).format(fee.amount);
}

export function formatVisitMode(mode: VisitMode, locale: AppLocale = 'en') {
  return formatterStrings[locale].visitMode[mode];
}
