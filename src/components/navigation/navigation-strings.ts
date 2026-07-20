import type { LocalizedStrings } from '@/localization/use-strings';

const en = {
  errorBoundary: {
    body: 'This screen could not finish loading. Your account and appointments are safe; try again or return to the home screen.',
    title: 'Hakeemi needs a fresh start',
    tryAgain: 'Try again',
  },
  restoringSession: {
    accessibilityLabel: 'Restoring account session',
    message: 'Restoring your session…',
  },
  tabs: {
    appointments: 'Appointments',
    findCare: 'Find care',
    home: 'Home',
    profile: 'Profile',
  },
};

export const navigationStrings: LocalizedStrings<typeof en> = {
  ar: {
    errorBoundary: {
      body: 'تعذّر إكمال تحميل هذه الشاشة. حسابك ومواعيدك في أمان؛ حاول مرة أخرى أو عد إلى الشاشة الرئيسية.',
      title: 'يحتاج «حكيمي» إلى بداية جديدة',
      tryAgain: 'حاول مرة أخرى',
    },
    restoringSession: {
      accessibilityLabel: 'جارٍ استعادة جلسة الحساب',
      message: 'جارٍ استعادة جلستك…',
    },
    tabs: {
      appointments: 'المواعيد',
      findCare: 'ابحث عن رعاية',
      home: 'الرئيسية',
      profile: 'الملف الشخصي',
    },
  },
  en,
};
