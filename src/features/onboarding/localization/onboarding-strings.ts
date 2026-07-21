import type { LocalizedStrings } from '@/localization/use-strings';

const en = {
  back: 'Back',
  brandWordmark: 'Hakeemi',
  createAccount: 'Create account',
  exploreDemo: 'Explore the demo',
  exploreDemoAccessibilityLabel: 'Explore the Hakeemi demo',
  headline: 'Care, without the runaround.',
  next: 'Next',
  nextAccessibilityLabel: 'Show the next onboarding page',
  signIn: 'Sign in',
  skip: 'Skip',
  skipAccessibilityLabel: 'Skip onboarding and explore Hakeemi',
  slideBookBody: 'One tap reserves your time through a secure, double-booking-proof transaction.',
  slideBookTitle: 'Book with confidence',
  slideCareBody: 'English or Arabic, light or dark — your care follows your preferences.',
  slideCareTitle: 'Care in your language',
  slideDiscoverBody: 'Search by specialty or language and compare real availability.',
  slideDiscoverTitle: 'Find the right clinician',
  subheadline:
    'Find the right clinician, compare availability, and book care in a few clear steps.',
  stepProgress: (current: number, total: number) => `Step ${current} of ${total}`,
};

export const onboardingStrings: LocalizedStrings<typeof en> = {
  ar: {
    back: 'رجوع',
    brandWordmark: 'Hakeemi',
    createAccount: 'إنشاء حساب',
    exploreDemo: 'استكشف العرض التجريبي',
    exploreDemoAccessibilityLabel: 'استكشف العرض التجريبي لتطبيق حكيمي',
    headline: 'رعاية صحية، من دون تعقيدات.',
    next: 'التالي',
    nextAccessibilityLabel: 'اعرض صفحة التعريف التالية',
    signIn: 'تسجيل الدخول',
    skip: 'تخطّي',
    skipAccessibilityLabel: 'تخطّ صفحات التعريف واستكشف العرض التجريبي لتطبيق حكيمي',
    slideBookBody: 'نقرة واحدة تحجز وقتك عبر معاملة آمنة تمنع تعارض الحجوزات.',
    slideBookTitle: 'احجز بثقة',
    slideCareBody: 'بالإنجليزية أو العربية، بوضع فاتح أو داكن — رعايتك تتبع تفضيلاتك.',
    slideCareTitle: 'رعاية بلغتك',
    slideDiscoverBody: 'ابحث حسب التخصص أو اللغة وقارن المواعيد المتاحة فعليًا.',
    slideDiscoverTitle: 'اعثر على الطبيب المناسب',
    subheadline: 'اعثر على الطبيب المناسب، وقارن المواعيد المتاحة، واحجز رعايتك بخطوات واضحة.',
    stepProgress: (current: number, total: number) => `الخطوة ${current} من ${total}`,
  },
  en,
};
