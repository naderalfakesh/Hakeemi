import type { LocalizedStrings } from '@/localization/use-strings';

const en = {
  brandWordmark: 'Hakeemi',
  createAccount: 'Create account',
  exploreDemo: 'Explore the demo',
  exploreDemoAccessibilityLabel: 'Explore the Hakeemi demo without an account',
  headline: 'Welcome to Hakeemi',
  signIn: 'Sign in',
  subheadline: 'Find care, compare real availability, and book in a few clear steps.',
};

export const welcomeStrings: LocalizedStrings<typeof en> = {
  ar: {
    brandWordmark: 'Hakeemi',
    createAccount: 'إنشاء حساب',
    exploreDemo: 'استكشف العرض التجريبي',
    exploreDemoAccessibilityLabel: 'استكشف العرض التجريبي لتطبيق حكيمي من دون حساب',
    headline: 'مرحبًا بك في حكيمي',
    signIn: 'تسجيل الدخول',
    subheadline: 'اعثر على الرعاية المناسبة، وقارن المواعيد المتاحة، واحجز بخطوات واضحة.',
  },
  en,
};
