import i18next from 'i18next';
import en from './en';
import ar from './ar';

export const resources = {
  en,
  ar,
} as const;

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
});

declare module 'react-i18next' {
  type DefaultResources = typeof resources['en'];
  interface Resources extends DefaultResources {}
}

export default i18n;
