import { describe, expect, it } from 'vitest';
import { DEFAULT_LOCALE, resolveLocale } from './locale';
import { getLocaleDictionary, resources } from './resources';

describe('resolveLocale', () => {
  it('falls back to zh-CN for unknown input', () => {
    expect(resolveLocale(undefined)).toBe(DEFAULT_LOCALE);
    expect(resolveLocale('ja-JP')).toBe(DEFAULT_LOCALE);
  });
});

describe('resources', () => {
  const toolAppKeys = [
    'formatter.action.clear',
    'formatter.action.copyResult',
    'formatter.action.format',
    'formatter.error.copyEmpty',
    'formatter.error.copyFailed',
    'formatter.error.formatFailed',
    'formatter.error.xmlEmpty',
    'formatter.error.xmlInvalid',
    'formatter.jsonView.action.copyFieldContent',
    'formatter.jsonView.action.copyFieldName',
    'formatter.jsonView.action.collapseAll',
    'formatter.jsonView.action.defaultExpand',
    'formatter.jsonView.action.expandAll',
    'formatter.jsonView.copyFieldContentSuccess',
    'formatter.jsonView.copyFieldNameSuccess',
    'formatter.placeholder.input',
    'formatter.placeholder.result',
    'formatter.result.title',
    'colorPicker.copyLabel.hex',
    'colorPicker.copyLabel.hsl',
    'colorPicker.copyLabel.rgb',
    'colorPicker.copySuccess',
    'colorPicker.error.canvasReadFailed',
    'colorPicker.error.copyFailed',
    'colorPicker.error.eyeDropperUnavailable',
    'colorPicker.error.imageLoadFailed',
    'colorPicker.error.imageReadFailed',
    'colorPicker.error.imageUnavailable',
    'colorPicker.hint.clickToPick',
    'colorPicker.hint.imageUpload',
    'colorPicker.hint.pagePick',
    'colorPicker.section.colorInfo',
    'colorPicker.section.pickMode',
    'colorPicker.status.cancelled',
    'colorPicker.unavailable.eyeDropperMissing',
    'colorPicker.unavailable.fallback',
    'colorPicker.unavailable.inIframe',
    'colorPicker.unavailable.insecureContext',
    'colorPicker.action.clearImage',
    'colorPicker.action.pickFromImage',
    'colorPicker.action.pickFromPage',
  ];

  it('registers zh-CN and en-US dictionaries', () => {
    expect(Object.keys(resources)).toEqual(['zh-CN', 'en-US']);
    expect(getLocaleDictionary('zh-CN')['route.home.title']).toBe('我的应用');
    expect(getLocaleDictionary('en-US')['route.home.title']).toBe('My Apps');
  });

  it('keeps both locales aligned for shared keys', () => {
    expect(getLocaleDictionary('zh-CN')['home.section.tools']).toBeTruthy();
    expect(getLocaleDictionary('en-US')['home.section.tools']).toBeTruthy();
  });

  it('includes formatter and color picker translations in both locales', () => {
    const zhCn = getLocaleDictionary('zh-CN') as Record<string, string>;
    const enUs = getLocaleDictionary('en-US') as Record<string, string>;

    expect(toolAppKeys.every(key => Boolean(zhCn[key]))).toBe(true);
    expect(toolAppKeys.every(key => Boolean(enUs[key]))).toBe(true);
  });
});
