import i18next, { type TOptions } from 'i18next';
import { initReactI18next, useTranslation } from 'react-i18next';
import {
  DEFAULT_LOCALE,
  FALLBACK_LOCALE,
  getTranslationDefaultValue,
  getTranslationKey,
  isSupportedLocale,
  resources,
  type Locale,
  type TranslationInput,
} from '@volix/i18n';
import { Fragment, useMemo, type PropsWithChildren } from 'react';
import { getStoredLocale, setStoredLocale } from './storage';

let initialized = false;

export const ensureI18n = async () => {
  if (initialized) {
    return i18next;
  }

  await i18next.use(initReactI18next).init({
    resources,
    lng: getStoredLocale(),
    fallbackLng: FALLBACK_LOCALE,
    supportedLngs: Object.keys(resources),
    defaultNS: 'translation',
    ns: ['translation'],
    interpolation: {
      escapeValue: false,
    },
  });

  initialized = true;
  return i18next;
};

export function I18nProvider({ children }: PropsWithChildren) {
  return <Fragment>{children}</Fragment>;
}

export const translateClient = (input: TranslationInput, values?: TOptions) => {
  return i18next.t(getTranslationKey(input), {
    defaultValue: getTranslationDefaultValue(input),
    ...values,
  });
};

export const setClientLocale = (nextLocale: Locale) => {
  setStoredLocale(nextLocale);
  return i18next.changeLanguage(nextLocale);
};

export const useI18n = () => {
  const { i18n } = useTranslation();
  const locale = (isSupportedLocale(i18n.resolvedLanguage) ? i18n.resolvedLanguage : DEFAULT_LOCALE) as Locale;

  return useMemo(
    () => ({
      locale,
      setLocale: setClientLocale,
      t: translateClient,
    }),
    [locale]
  );
};
