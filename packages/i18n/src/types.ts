export type Locale = 'zh-CN' | 'en-US';

export type MessageDescriptor = {
  id: string;
  defaultMessage: string;
};

export type MessageValues = Record<string, string | number>;

export type TranslationDictionary = Record<string, string>;

export type TranslationInput = string | MessageDescriptor;
