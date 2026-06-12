import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { FormatConvertCommandMode } from '@volix/types';
import { createFormatConvertDraft } from '../../preset-options';

vi.mock('@douyinfe/semi-ui', () => ({
  Input: ({ placeholder }: { placeholder?: string }) => createElement('input', { placeholder, readOnly: true }),
  Select: ({ value }: { value?: string }) => createElement('select', { defaultValue: value }),
}));

vi.mock('@/i18n', () => ({
  useI18n: () => ({
    t: (key: string) =>
      ((
        {
          'formatConvert.form.commandMode': '转换方式',
          'formatConvert.form.outputFormat': '输出格式',
          'formatConvert.form.videoCodec': '视频编码',
          'formatConvert.form.audioCodec': '音频编码',
          'formatConvert.form.resolution': '分辨率',
          'formatConvert.form.customArgs': '自定义参数',
          'formatConvert.form.customArgsPlaceholder': '例如 -movflags +faststart',
          'formatConvert.form.commandModePreset': '预设模式',
          'formatConvert.form.commandModeCustom': '自定义附加参数',
          'formatConvert.form.preset': '预设方案',
        } as Record<string, string>
      )[key] || key),
  }),
}));

describe('convert settings form', () => {
  it('shows only custom args controls in custom command mode', async () => {
    const { ConvertSettingsForm } = await import('../convert-settings-form');
    const draft = createFormatConvertDraft();
    draft.commandMode = FormatConvertCommandMode.CUSTOM;
    draft.option.customArgsText = '-movflags +faststart';

    const markup = renderToStaticMarkup(
      createElement(ConvertSettingsForm, {
        draft,
        onChange: () => undefined,
      })
    );

    expect(markup).toContain('转换方式');
    expect(markup).toContain('自定义参数');
    expect(markup).not.toContain('预设方案');
    expect(markup).not.toContain('输出格式');
    expect(markup).not.toContain('视频编码');
    expect(markup).not.toContain('音频编码');
    expect(markup).not.toContain('分辨率');
  });
});
