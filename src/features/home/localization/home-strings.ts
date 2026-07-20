import type { LocalizedStrings } from '@/localization/use-strings';

const homeEn = {
  availableSoon: 'Available soon',
  browseAllClinicians: 'Browse all clinicians',
  clinicianFallback: 'Clinician',
  emptyDescription: 'The demo repository has no featured providers right now.',
  emptyTitle: 'No recommendations yet',
  errorMessage: 'Featured clinicians could not be loaded.',
  featureDescription: 'Search by specialty and compare the details that matter before choosing.',
  featureTitle: 'Find the right clinician',
  featuredClinicians: 'Featured fictional clinicians',
  fictionalDataNote:
    'All clinicians and availability are fictional portfolio data, served from the rebuilt Firebase architecture on native builds.',
  findCare: 'Find care',
  greeting: 'What would help today?',
  loadingFeatured: 'Loading featured clinicians',
  openCatalogue: 'Open component catalogue',
  portfolioDemo: 'Portfolio demo',
  seeAll: 'See all',
  tryAgain: 'Try again',
};

export const homeStrings: LocalizedStrings<typeof homeEn> = {
  ar: {
    availableSoon: 'متاحون قريبًا',
    browseAllClinicians: 'تصفح جميع الأطباء',
    clinicianFallback: 'طبيب',
    emptyDescription: 'لا يحتوي المستودع التجريبي على أطباء مميزين حاليًا.',
    emptyTitle: 'لا توجد توصيات بعد',
    errorMessage: 'تعذّر تحميل الأطباء المميزين.',
    featureDescription: 'ابحث حسب التخصص وقارن التفاصيل المهمة قبل الاختيار.',
    featureTitle: 'اعثر على الطبيب المناسب',
    featuredClinicians: 'أطباء خياليون مميزون',
    fictionalDataNote:
      'جميع الأطباء والمواعيد بيانات خيالية لأغراض العرض، مقدَّمة من بنية Firebase المعاد بناؤها في إصدارات التطبيق الأصلية.',
    findCare: 'ابحث عن رعاية',
    greeting: 'ما الذي يساعدك اليوم؟',
    loadingFeatured: 'جارٍ تحميل الأطباء المميزين',
    openCatalogue: 'فتح كتالوج المكونات',
    portfolioDemo: 'عرض تجريبي',
    seeAll: 'عرض الكل',
    tryAgain: 'حاول مرة أخرى',
  },
  en: homeEn,
};
