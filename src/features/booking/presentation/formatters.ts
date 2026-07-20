import type { AppointmentReasonCategory } from '@/features/appointments/domain/types';
import type { AvailabilitySlot } from '@/features/care/domain/types';
import { formatAvailability, formatVisitMode } from '@/features/care/presentation/formatters';
import type { AppLocale } from '@/localization/locale-provider';
import type { LocalizedStrings } from '@/localization/use-strings';

type ReasonCategoryValue = AppointmentReasonCategory | null;

const reasonCategoryValues: readonly ReasonCategoryValue[] = [
  'routine_visit',
  'new_concern',
  'follow_up',
  'preventive_care',
  'other',
  null,
];

const reasonCategoryStrings: LocalizedStrings<{
  labels: Record<AppointmentReasonCategory, string>;
  preferNotToSay: string;
}> = {
  ar: {
    labels: {
      follow_up: 'زيارة متابعة',
      new_concern: 'شكوى جديدة',
      other: 'سبب آخر',
      preventive_care: 'رعاية وقائية',
      routine_visit: 'زيارة روتينية',
    },
    preferNotToSay: 'أفضّل عدم الإفصاح',
  },
  en: {
    labels: {
      follow_up: 'Follow-up',
      new_concern: 'New concern',
      other: 'Another reason',
      preventive_care: 'Preventive care',
      routine_visit: 'Routine visit',
    },
    preferNotToSay: 'Prefer not to say',
  },
};

function reasonCategoryLabel(value: ReasonCategoryValue, locale: AppLocale) {
  const strings = reasonCategoryStrings[locale];
  return value === null ? strings.preferNotToSay : strings.labels[value];
}

export function getReasonCategoryOptions(locale: AppLocale = 'en'): readonly {
  label: string;
  value: ReasonCategoryValue;
}[] {
  return reasonCategoryValues.map((value) => ({
    label: reasonCategoryLabel(value, locale),
    value,
  }));
}

export function formatReasonCategory(category: ReasonCategoryValue, locale: AppLocale = 'en') {
  return reasonCategoryLabel(category, locale);
}

export function formatBookingSlot(slot: AvailabilitySlot, locale: AppLocale = 'en') {
  return `${formatAvailability(slot, locale)} · ${formatVisitMode(slot.visitMode, locale)}`;
}
