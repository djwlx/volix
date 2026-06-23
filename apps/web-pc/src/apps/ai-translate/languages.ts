export interface TranslateLanguageOption {
  value: string;
  labelKey: string;
  defaultLabel: string;
}

export const TRANSLATE_LANGUAGE_OPTIONS: TranslateLanguageOption[] = [
  {
    value: 'auto',
    labelKey: 'aiTranslate.language.auto',
    defaultLabel: '自动识别',
  },
  {
    value: 'zh-CN',
    labelKey: 'aiTranslate.language.zhCn',
    defaultLabel: '中文',
  },
  {
    value: 'en-US',
    labelKey: 'aiTranslate.language.enUs',
    defaultLabel: '英文',
  },
  {
    value: 'ja-JP',
    labelKey: 'aiTranslate.language.jaJp',
    defaultLabel: '日文',
  },
  {
    value: 'ko-KR',
    labelKey: 'aiTranslate.language.koKr',
    defaultLabel: '韩文',
  },
];
