import type { AvailabilitySlot, Money, VisitMode } from '../domain/types';

export function formatAvailability(slot: AvailabilitySlot, locale = 'en-AE') {
  return new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    month: 'short',
    timeZone: slot.timezone,
    weekday: 'short',
  }).format(new Date(slot.startsAt));
}

export function formatFee(fee: Money | null, locale = 'en-AE') {
  if (!fee) {
    return 'Fee on request';
  }

  return new Intl.NumberFormat(locale, {
    currency: fee.currency,
    maximumFractionDigits: 0,
    style: 'currency',
  }).format(fee.amount);
}

export function formatVisitMode(mode: VisitMode) {
  return mode === 'video' ? 'Video visit' : 'In person';
}
