import type { LocalizedStrings } from '@/localization/use-strings';

import type { AuthValidationMessages } from '../domain/schemas';

export const authValidationStrings: LocalizedStrings<AuthValidationMessages> = {
  ar: {
    confirmPasswordRequired: 'أكّد كلمة المرور.',
    emailInvalid: 'أدخل عنوان بريد إلكتروني صالحًا.',
    emailRequired: 'أدخل عنوان بريدك الإلكتروني.',
    nameMaxLength: 'اجعل اسمك أقل من 80 حرفًا.',
    nameMinLength: 'أدخل حرفين على الأقل.',
    passwordMinLength: 'استخدم 8 أحرف على الأقل.',
    passwordRequired: 'أدخل كلمة المرور.',
    passwordsDoNotMatch: 'كلمتا المرور غير متطابقتين.',
  },
  en: {
    confirmPasswordRequired: 'Confirm your password.',
    emailInvalid: 'Enter a valid email address.',
    emailRequired: 'Enter your email address.',
    nameMaxLength: 'Keep your name under 80 characters.',
    nameMinLength: 'Enter at least 2 characters.',
    passwordMinLength: 'Use at least 8 characters.',
    passwordRequired: 'Enter your password.',
    passwordsDoNotMatch: 'Passwords do not match.',
  },
};
