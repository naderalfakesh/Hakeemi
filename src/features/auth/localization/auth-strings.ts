import type { LocalizedStrings } from '@/localization/use-strings';

const scaffoldEn = {
  disclaimer: 'Portfolio demonstration only. Do not enter real medical information.',
  goBack: 'Go back',
};

export const authScaffoldStrings: LocalizedStrings<typeof scaffoldEn> = {
  ar: {
    disclaimer: 'هذا عرض توضيحي لمعرض الأعمال فقط. لا تُدخل أي معلومات طبية حقيقية.',
    goBack: 'العودة',
  },
  en: scaffoldEn,
};

const signInEn = {
  continueAsGuest: 'Continue as guest',
  createAccount: 'Create an account',
  emailLabel: 'Email',
  emailPlaceholder: 'you@example.com',
  eyebrow: 'SECURE ACCOUNT',
  forgotPassword: 'Forgot password?',
  passwordLabel: 'Password',
  signIn: 'Sign in',
  subtitle: 'Restore appointments and preferences across your devices.',
  title: 'Welcome back',
};

export const signInStrings: LocalizedStrings<typeof signInEn> = {
  ar: {
    continueAsGuest: 'المتابعة كضيف',
    createAccount: 'إنشاء حساب',
    emailLabel: 'البريد الإلكتروني',
    emailPlaceholder: 'you@example.com',
    eyebrow: 'حساب آمن',
    forgotPassword: 'هل نسيت كلمة المرور؟',
    passwordLabel: 'كلمة المرور',
    signIn: 'تسجيل الدخول',
    subtitle: 'استعد مواعيدك وتفضيلاتك عبر جميع أجهزتك.',
    title: 'مرحبًا بعودتك',
  },
  en: signInEn,
};

const signUpEn = {
  alreadyHaveAccount: 'I already have an account',
  confirmPasswordLabel: 'Confirm password',
  createAccount: 'Create account',
  emailLabel: 'Email',
  emailPlaceholder: 'demo@example.com',
  eyebrow: 'YOUR HAKEEMI',
  nameLabel: 'Name',
  namePlaceholder: 'Demo Patient',
  passwordHint: 'At least 8 characters',
  passwordLabel: 'Password',
  subtitle: 'Use fictional details for this portfolio environment.',
  title: 'Create your account',
};

export const signUpStrings: LocalizedStrings<typeof signUpEn> = {
  ar: {
    alreadyHaveAccount: 'لديّ حساب بالفعل',
    confirmPasswordLabel: 'تأكيد كلمة المرور',
    createAccount: 'إنشاء الحساب',
    emailLabel: 'البريد الإلكتروني',
    emailPlaceholder: 'demo@example.com',
    eyebrow: '«حكيمي» الخاص بك',
    nameLabel: 'الاسم',
    namePlaceholder: 'مريض تجريبي',
    passwordHint: '8 أحرف على الأقل',
    passwordLabel: 'كلمة المرور',
    subtitle: 'استخدم بيانات خيالية في بيئة معرض الأعمال هذه.',
    title: 'أنشئ حسابك',
  },
  en: signUpEn,
};

const verifyEmailEn = {
  continueToHakeemi: 'Continue to Hakeemi',
  eyebrow: 'ONE LAST STEP',
  resendConfirmation: 'A fresh verification email was sent.',
  resendEmail: 'Resend email',
  sentTo: 'We sent a verification link to:',
  subtitle: 'Verification keeps the demo account recoverable and prevents mistyped addresses.',
  title: 'Verify your email',
  useAnotherAccount: 'Use another account',
};

export const verifyEmailStrings: LocalizedStrings<typeof verifyEmailEn> = {
  ar: {
    continueToHakeemi: 'المتابعة إلى «حكيمي»',
    eyebrow: 'خطوة أخيرة',
    resendConfirmation: 'تم إرسال رسالة تحقق جديدة.',
    resendEmail: 'إعادة إرسال الرسالة',
    sentTo: 'أرسلنا رابط التحقق إلى:',
    subtitle: 'يحافظ التحقق على إمكانية استعادة الحساب التجريبي ويمنع العناوين المكتوبة خطأً.',
    title: 'تحقق من بريدك الإلكتروني',
    useAnotherAccount: 'استخدام حساب آخر',
  },
  en: verifyEmailEn,
};

const forgotPasswordEn = {
  backToSignIn: 'Back to sign in',
  checkInbox: 'Check your inbox',
  emailLabel: 'Email',
  emailPlaceholder: 'you@example.com',
  eyebrow: 'ACCOUNT RECOVERY',
  resetSent: (email: string) =>
    `If an account exists for ${email}, Firebase has sent password reset instructions.`,
  sendResetInstructions: 'Send reset instructions',
  subtitle: 'We keep the response neutral so an email address cannot be used to discover accounts.',
  title: 'Reset your password',
};

export const forgotPasswordStrings: LocalizedStrings<typeof forgotPasswordEn> = {
  ar: {
    backToSignIn: 'العودة إلى تسجيل الدخول',
    checkInbox: 'تفقّد بريدك الوارد',
    emailLabel: 'البريد الإلكتروني',
    emailPlaceholder: 'you@example.com',
    eyebrow: 'استعادة الحساب',
    resetSent: (email) =>
      `إذا كان هناك حساب مرتبط بالعنوان ${email}، فقد أرسل Firebase تعليمات إعادة تعيين كلمة المرور.`,
    sendResetInstructions: 'إرسال تعليمات إعادة التعيين',
    subtitle: 'نُبقي الرد محايدًا حتى لا يمكن استخدام عنوان البريد الإلكتروني لاكتشاف الحسابات.',
    title: 'إعادة تعيين كلمة المرور',
  },
  en: forgotPasswordEn,
};
