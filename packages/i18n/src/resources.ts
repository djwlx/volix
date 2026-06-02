import enUs from './locales/en-US/translation.json';
import zhCn from './locales/zh-CN/translation.json';
import type { Locale, TranslationDictionary } from './types';

export const resources = {
  'zh-CN': {
    translation: zhCn,
  },
  'en-US': {
    translation: enUs,
  },
} satisfies Record<Locale, { translation: TranslationDictionary }>;

export const getLocaleDictionary = (locale: Locale) => {
  return resources[locale].translation;
};
