import type { LocalizedStrings } from '@/localization/use-strings';

import type { AppointmentFilter } from '../hooks/use-appointments';

const en = {
  emptyDescriptions: {
    cancelled: 'Cancelled visits will stay here so your care history remains clear.',
    past: 'Completed visits and appointments you missed will appear here.',
    upcoming: 'Choose a clinician and a real available slot to plan your next visit.',
  } as Record<AppointmentFilter, string>,
  emptyTitles: {
    cancelled: 'No cancelled appointments',
    past: 'No past appointments',
    upcoming: 'No upcoming appointments',
  } as Record<AppointmentFilter, string>,
  errorDescription: 'Your private appointment list could not be loaded.',
  errorTitle: 'Appointments unavailable',
  filterLabels: {
    cancelled: 'Cancelled',
    past: 'Past',
    upcoming: 'Upcoming',
  } as Record<AppointmentFilter, string>,
  findClinician: 'Find a clinician',
  loadingAppointments: 'Loading appointments',
  openAppointmentWith: (providerName: string) => `Open appointment with ${providerName}`,
  providerFallback: 'Provider',
  signIn: 'Sign in',
  signInDescription: 'Sign in to view appointments saved to your account.',
  signInTitle: 'Your appointments stay private',
  subtitle: 'Keep upcoming care close and revisit your appointment history.',
  title: 'Appointments',
  tryAgain: 'Try again',
};

export const appointmentsStrings: LocalizedStrings<typeof en> = {
  ar: {
    emptyDescriptions: {
      cancelled: 'ستبقى الزيارات الملغاة هنا ليظل سجل رعايتك واضحًا.',
      past: 'ستظهر هنا الزيارات المكتملة والمواعيد التي فاتتك.',
      upcoming: 'اختر طبيبًا وموعدًا متاحًا فعليًا للتخطيط لزيارتك القادمة.',
    },
    emptyTitles: {
      cancelled: 'لا توجد مواعيد ملغاة',
      past: 'لا توجد مواعيد سابقة',
      upcoming: 'لا توجد مواعيد قادمة',
    },
    errorDescription: 'تعذّر تحميل قائمة مواعيدك الخاصة.',
    errorTitle: 'المواعيد غير متاحة',
    filterLabels: {
      cancelled: 'الملغاة',
      past: 'السابقة',
      upcoming: 'القادمة',
    },
    findClinician: 'ابحث عن طبيب',
    loadingAppointments: 'جارٍ تحميل المواعيد',
    openAppointmentWith: (providerName) => `فتح الموعد مع ${providerName}`,
    providerFallback: 'مقدم الرعاية',
    signIn: 'تسجيل الدخول',
    signInDescription: 'سجّل الدخول لعرض المواعيد المحفوظة في حسابك.',
    signInTitle: 'مواعيدك تبقى خاصة',
    subtitle: 'أبقِ رعايتك القادمة قريبة منك وراجع سجل مواعيدك.',
    title: 'المواعيد',
    tryAgain: 'حاول مرة أخرى',
  },
  en,
};
