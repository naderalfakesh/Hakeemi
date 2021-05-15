import i18next from 'i18next';
import en from './en';
import ar from './ar';
import { format } from 'date-fns';
import { enGB as English, ar as Arabic } from 'date-fns/locale';

export const resources = {
  en,
  ar,
} as const;

const getDateLocale = (lng?: string) => {
  switch (lng) {
    case 'ar':
      return Arabic;
    case 'en':
    default:
      return English;
  }
};

const i18n = i18next.createInstance();
i18n.init({
  fallbackLng: 'en',
  lng: 'en',
  supportedLngs: ['en', 'ar'],
  defaultNS: 'common',
  resources,
  react: {
    useSuspense: false,
  },
  interpolation: {
    format: (value, pattern, lng) => {
      if (value instanceof Date && pattern) {
        return format(value, pattern, { locale: getDateLocale(lng) });
      }
      return value;
    },
  },
});

declare module 'react-i18next' {
  type DefaultResources = typeof resources['en'];
  interface Resources extends DefaultResources {}
}

export default i18n;
