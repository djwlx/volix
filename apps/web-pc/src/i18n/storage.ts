import { DEFAULT_LOCALE, resolveLocale, type Locale } from '@volix/i18n';

const STORAGE_KEY = 'volix-language';

export const getStoredLocale = (): Locale => {
  if (typeof window === 'undefined') {
    return DEFAULT_LOCALE;
  }

  return resolveLocale(window.localStorage.getItem(STORAGE_KEY));
};

export const setStoredLocale = (locale: Locale) => {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, locale);
};
