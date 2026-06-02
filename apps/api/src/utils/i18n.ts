import i18next from 'i18next';
import {
  DEFAULT_LOCALE,
  FALLBACK_LOCALE,
  getTranslationDefaultValue,
  getTranslationKey,
  resources,
  type Locale,
  type TranslationInput,
} from '@volix/i18n';
import type { TOptions } from 'i18next';
import { getRequestLocale } from './request-context';

void i18next.init({
  resources,
  lng: DEFAULT_LOCALE,
  fallbackLng: FALLBACK_LOCALE,
  supportedLngs: Object.keys(resources),
  defaultNS: 'translation',
  ns: ['translation'],
  interpolation: {
    escapeValue: false,
  },
});

export const t = (input: TranslationInput, values?: TOptions, locale?: Locale) => {
  return i18next.t(getTranslationKey(input), {
    lng: locale || getRequestLocale() || DEFAULT_LOCALE,
    defaultValue: getTranslationDefaultValue(input),
    ...values,
  });
};
