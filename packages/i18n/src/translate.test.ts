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
  it('registers zh-CN and en-US dictionaries', () => {
    expect(Object.keys(resources)).toEqual(['zh-CN', 'en-US']);
    expect(getLocaleDictionary('zh-CN')['route.home.title']).toBe('我的应用');
    expect(getLocaleDictionary('en-US')['route.home.title']).toBe('My Apps');
  });

  it('keeps both locales aligned for shared keys', () => {
    expect(getLocaleDictionary('zh-CN')['home.section.tools']).toBeTruthy();
    expect(getLocaleDictionary('en-US')['home.section.tools']).toBeTruthy();
  });
});
