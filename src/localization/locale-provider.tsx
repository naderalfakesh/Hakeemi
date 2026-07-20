import { createContext, useContext, type ReactNode } from 'react';

export type AppLocale = 'ar' | 'en';

export type IntlLocale = 'ar-AE' | 'en-AE';

export function toIntlLocale(locale: AppLocale): IntlLocale {
  return locale === 'ar' ? 'ar-AE' : 'en-AE';
}

type AppLocaleContextValue = {
  intlLocale: IntlLocale;
  isRTL: boolean;
  locale: AppLocale;
};

const defaultLocaleContext: AppLocaleContextValue = {
  intlLocale: 'en-AE',
  isRTL: false,
  locale: 'en',
};

const AppLocaleContext = createContext<AppLocaleContextValue>(defaultLocaleContext);

export function AppLocaleProvider({
  children,
  locale,
}: {
  children: ReactNode;
  locale: AppLocale;
}) {
  const value: AppLocaleContextValue = {
    intlLocale: toIntlLocale(locale),
    isRTL: locale === 'ar',
    locale,
  };

  return <AppLocaleContext.Provider value={value}>{children}</AppLocaleContext.Provider>;
}

export function useAppLocale() {
  return useContext(AppLocaleContext);
}
