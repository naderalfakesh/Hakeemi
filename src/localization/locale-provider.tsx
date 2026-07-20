import { createContext, useContext, type ReactNode } from 'react';

export type AppLocale = 'ar' | 'en';

type AppLocaleContextValue = {
  intlLocale: 'ar-AE' | 'en-AE';
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
    intlLocale: locale === 'ar' ? 'ar-AE' : 'en-AE',
    isRTL: locale === 'ar',
    locale,
  };

  return <AppLocaleContext.Provider value={value}>{children}</AppLocaleContext.Provider>;
}

export function useAppLocale() {
  return useContext(AppLocaleContext);
}
