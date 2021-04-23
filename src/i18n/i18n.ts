import i18next from 'i18next';
import en from './en';
import ar from './ar';

const i18n = i18next.createInstance();
i18n.init({
  fallbackLng: 'en',
  lng: 'en',
  supportedLngs: ['en', 'ar'],
  defaultNS: 'common',
  resources: {
    en,
    ar,
  },
  react: {
    useSuspense: false,
  },
});

export default i18n;
