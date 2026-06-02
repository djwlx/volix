import type { TranslationInput } from './types';

export const getTranslationKey = (input: TranslationInput) => {
  return typeof input === 'string' ? input : input.id;
};

export const getTranslationDefaultValue = (input: TranslationInput) => {
  return typeof input === 'string' ? undefined : input.defaultMessage;
};
