import type { LocalizedStrings } from '@/localization/use-strings';

const findCareEn = {
  clearFilters: 'Clear search and filters',
  clinicianFallback: 'Clinician',
  emptyDescription: 'Try another name, specialty, or language.',
  emptyTitle: 'No clinicians match',
  errorDescription: 'Check your connection and retry. Your search has not been lost.',
  errorTitle: 'Clinicians could not be loaded',
  loadMoreClinicians: 'Load more clinicians',
  loadingClinicians: 'Loading clinicians',
  loadingMoreClinicians: 'Loading more clinicians',
  searchAccessibilityLabel: 'Search clinicians',
  searchLabel: 'Search',
  searchPlaceholder: 'Try cardiology or Arabic',
  subtitle: 'Search by clinician, specialty, or language.',
  title: 'Find care',
  tryAgain: 'Try again',
};

export const findCareStrings: LocalizedStrings<typeof findCareEn> = {
  ar: {
    clearFilters: 'مسح البحث والتصفية',
    clinicianFallback: 'طبيب',
    emptyDescription: 'جرّب اسمًا آخر، أو تخصصًا آخر، أو لغة أخرى.',
    emptyTitle: 'لا يوجد أطباء مطابقون',
    errorDescription: 'تحقق من اتصالك وحاول مرة أخرى، فبحثك لم يُفقد.',
    errorTitle: 'تعذّر تحميل الأطباء',
    loadMoreClinicians: 'تحميل المزيد من الأطباء',
    loadingClinicians: 'جارٍ تحميل الأطباء',
    loadingMoreClinicians: 'جارٍ تحميل المزيد من الأطباء',
    searchAccessibilityLabel: 'البحث عن الأطباء',
    searchLabel: 'بحث',
    searchPlaceholder: 'جرّب أمراض القلب أو اللغة العربية',
    subtitle: 'ابحث حسب الطبيب أو التخصص أو اللغة.',
    title: 'ابحث عن رعاية',
    tryAgain: 'حاول مرة أخرى',
  },
  en: findCareEn,
};

export const clinicianCountLabels = {
  ar: {
    few: 'أطباء',
    many: 'طبيبًا',
    one: 'طبيب',
    other: 'طبيب',
    two: 'طبيبان',
    zero: 'أطباء',
  },
  en: { one: 'clinician', other: 'clinicians' },
} as const;

const providerCardEn = {
  contactClinic: 'Contact the clinic for availability',
  nextAvailable: 'Next available',
  viewProfileFor: (name: string) => `View profile for ${name}`,
};

export const providerCardStrings: LocalizedStrings<typeof providerCardEn> = {
  ar: {
    contactClinic: 'تواصل مع العيادة لمعرفة المواعيد المتاحة',
    nextAvailable: 'أقرب موعد متاح',
    viewProfileFor: (name) => `عرض الملف الشخصي للطبيب ${name}`,
  },
  en: providerCardEn,
};

export const reviewCountLabels = {
  ar: {
    few: 'مراجعات',
    many: 'مراجعة',
    one: 'مراجعة',
    other: 'مراجعة',
    two: 'مراجعتان',
    zero: 'مراجعات',
  },
  en: { other: 'reviews' },
} as const;

const providerDetailEn = {
  about: 'About',
  availableAppointments: 'Available appointments',
  backToClinicians: 'Back to clinicians',
  browseClinicians: 'Browse clinicians',
  choose: 'Choose',
  chooseSlot: (time: string) => `Choose ${time}`,
  clinics: 'Clinics',
  consultation: 'Consultation',
  disclosure:
    'This fictional profile demonstrates discovery UX with Firebase-backed availability. Confirmed bookings are protected by a server-controlled transaction.',
  errorDescription: 'Check your connection and retry the profile.',
  errorTitle: 'Profile could not be loaded',
  loadingProfile: 'Loading provider profile',
  next14Days: 'Next 14 days',
  noAppointments: 'No appointments are available in this window. Check again soon.',
  notFoundDescription: (providerId: string) =>
    `No active fictional provider matches “${providerId}”.`,
  notFoundTitle: 'Provider not found',
  providerProfile: 'Provider profile',
  removeFromSaved: (name: string) => `Remove ${name} from saved clinicians`,
  save: (name: string) => `Save ${name}`,
  timezoneNote: 'Times are shown in Gulf Standard Time. Choose an available time to continue.',
  tryAgain: 'Try again',
  visitOptions: 'Visit options',
};

export const providerDetailStrings: LocalizedStrings<typeof providerDetailEn> = {
  ar: {
    about: 'نبذة',
    availableAppointments: 'المواعيد المتاحة',
    backToClinicians: 'العودة إلى الأطباء',
    browseClinicians: 'تصفح الأطباء',
    choose: 'اختيار',
    chooseSlot: (time) => `اختر ${time}`,
    clinics: 'العيادات',
    consultation: 'الاستشارة',
    disclosure:
      'يعرض هذا الملف الشخصي الخيالي تجربة استكشاف الرعاية مع مواعيد مدعومة من Firebase، والحجوزات المؤكدة محمية بمعاملة يتحكم بها الخادم.',
    errorDescription: 'تحقق من اتصالك وأعد محاولة تحميل الملف الشخصي.',
    errorTitle: 'تعذّر تحميل الملف الشخصي',
    loadingProfile: 'جارٍ تحميل الملف الشخصي للطبيب',
    next14Days: 'الأيام الأربعة عشر القادمة',
    noAppointments: 'لا توجد مواعيد متاحة في هذه الفترة، تحقق مرة أخرى قريبًا.',
    notFoundDescription: (providerId) => `لا يوجد طبيب خيالي نشط يطابق «${providerId}».`,
    notFoundTitle: 'الطبيب غير موجود',
    providerProfile: 'الملف الشخصي للطبيب',
    removeFromSaved: (name) => `إزالة ${name} من الأطباء المحفوظين`,
    save: (name) => `حفظ ${name}`,
    timezoneNote: 'الأوقات معروضة بتوقيت الخليج. اختر وقتًا متاحًا للمتابعة.',
    tryAgain: 'حاول مرة أخرى',
    visitOptions: 'خيارات الزيارة',
  },
  en: providerDetailEn,
};

export const availableAppointmentCountLabels = {
  ar: {
    few: 'مواعيد متاحة',
    many: 'موعدًا متاحًا',
    one: 'موعد متاح',
    other: 'موعد متاح',
    two: 'موعدان متاحان',
    zero: 'مواعيد متاحة',
  },
  en: { other: 'available appointments' },
} as const;

const specialtyFilterEn = {
  all: 'All',
};

export const specialtyFilterStrings: LocalizedStrings<typeof specialtyFilterEn> = {
  ar: { all: 'الكل' },
  en: specialtyFilterEn,
};
