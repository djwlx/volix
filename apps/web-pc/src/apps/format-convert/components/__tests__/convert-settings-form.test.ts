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
    t: (key: string) => key,
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

    expect(markup).toContain('formatConvert.form.commandMode');
    expect(markup).toContain('formatConvert.form.customArgs');
    expect(markup).not.toContain('formatConvert.form.preset');
    expect(markup).not.toContain('formatConvert.form.outputFormat');
    expect(markup).not.toContain('formatConvert.form.videoCodec');
    expect(markup).not.toContain('formatConvert.form.audioCodec');
    expect(markup).not.toContain('formatConvert.form.resolution');
  });

  it('hides preset config controls for audio extract auto and shows its description', async () => {
    const { ConvertSettingsForm } = await import('../convert-settings-form');
    const draft = createFormatConvertDraft();
    draft.presetId = 'audio-extract-auto';
    draft.option.outputFormat = 'm4a' as never;

    const markup = renderToStaticMarkup(
      createElement(ConvertSettingsForm, {
        draft,
        onChange: () => undefined,
      })
    );

    expect(markup).toContain('formatConvert.form.preset');
    expect(markup).toContain('formatConvert.preset.audioExtractAutoDescription');
    expect(markup).not.toContain('formatConvert.form.outputFormat');
    expect(markup).not.toContain('formatConvert.form.videoCodec');
    expect(markup).not.toContain('formatConvert.form.audioCodec');
    expect(markup).not.toContain('formatConvert.form.resolution');
  });
});
