import type { Locale } from './types';

export const SUPPORTED_LOCALES = ['zh-CN', 'en-US'] as const;

export const DEFAULT_LOCALE: Locale = 'zh-CN';

export const FALLBACK_LOCALE: Locale = 'zh-CN';

export const isSupportedLocale = (value: unknown): value is Locale => {
  return typeof value === 'string' && SUPPORTED_LOCALES.includes(value as Locale);
};

export const resolveLocale = (value: unknown): Locale => {
  return isSupportedLocale(value) ? value : DEFAULT_LOCALE;
};
