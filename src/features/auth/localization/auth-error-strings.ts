import type { AppLocale } from '@/localization/locale-provider';
import type { LocalizedStrings } from '@/localization/use-strings';

import { toAuthActionError } from '../domain/errors';
import type { AuthFailureCode } from '../domain/types';

const authErrorStrings: LocalizedStrings<Record<AuthFailureCode, string>> = {
  ar: {
    'account-exists':
      'يوجد حساب يستخدم هذا البريد الإلكتروني بالفعل. جرّب تسجيل الدخول بدلًا من ذلك.',
    'invalid-credentials': 'البريد الإلكتروني أو كلمة المرور غير صحيحة. تحقق منهما وحاول مرة أخرى.',
    network: 'تعذّر على «حكيمي» الوصول إلى الخدمة. تحقق من اتصالك وحاول مرة أخرى.',
    'rate-limited': 'تم إجراء محاولات كثيرة جدًا. انتظر قليلًا، ثم حاول مرة أخرى.',
    unavailable: 'الوصول إلى الحساب متاح في نسختي iOS وAndroid من معرض الأعمال.',
    unknown: 'حدث خطأ ما أثناء الوصول إلى حسابك. يرجى المحاولة مرة أخرى.',
  },
  en: {
    'account-exists': 'An account already uses this email. Try signing in instead.',
    'invalid-credentials': 'The email or password is incorrect. Check both and try again.',
    network: 'Hakeemi could not reach the service. Check your connection and try again.',
    'rate-limited': 'Too many attempts were made. Wait a moment, then try again.',
    unavailable: 'Account access is available in the iOS and Android portfolio builds.',
    unknown: 'Something went wrong while accessing your account. Please try again.',
  },
};

export function localizeAuthError(error: unknown, locale: AppLocale): string {
  const code: AuthFailureCode = toAuthActionError(error).code;

  return authErrorStrings[locale][code];
}
