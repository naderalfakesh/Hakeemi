import type { AppLocale } from './locale-provider';
import { useAppLocale } from './locale-provider';

export type LocalizedStrings<T> = Readonly<Record<AppLocale, T>>;

export function resolveStrings<T>(bundle: LocalizedStrings<T>, locale: AppLocale): T {
  return bundle[locale];
}

export function useStrings<T>(bundle: LocalizedStrings<T>): T {
  const { locale } = useAppLocale();
  return resolveStrings(bundle, locale);
}
