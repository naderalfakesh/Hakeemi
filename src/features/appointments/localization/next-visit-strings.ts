import { formatLocalizedCount } from '@/localization/format';
import type { LocalizedStrings } from '@/localization/use-strings';

const dayLabels = {
  ar: { few: 'أيام', many: 'يومًا', one: 'يوم', other: 'يوم', two: 'يومين' },
  en: { one: 'day', other: 'days' },
};

const en = {
  accessibilityLabel: (providerName: string, when: string, time: string) =>
    `Next visit with ${providerName}, ${when}, ${time}`,
  openHint: 'Opens the visit details',
  title: 'Next visit',
  when: (days: number) =>
    days <= 0
      ? 'Today'
      : days === 1
        ? 'Tomorrow'
        : `In ${formatLocalizedCount(days, 'en', dayLabels)}`,
};

export const nextVisitStrings: LocalizedStrings<typeof en> = {
  ar: {
    accessibilityLabel: (providerName: string, when: string, time: string) =>
      `زيارتك القادمة مع ${providerName}، ${when}، ${time}`,
    openHint: 'يفتح تفاصيل الزيارة',
    title: 'زيارتك القادمة',
    when: (days: number) =>
      days <= 0
        ? 'اليوم'
        : days === 1
          ? 'غدًا'
          : `بعد ${formatLocalizedCount(days, 'ar', dayLabels)}`,
  },
  en,
};
