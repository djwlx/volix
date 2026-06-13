import { createElement } from 'react';
import type { ReactNode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@douyinfe/semi-ui', () => ({
  Card: ({ title, children }: { title?: ReactNode; children?: ReactNode }) =>
    createElement('section', { 'data-card-title-provided': title ? 'true' : 'false' }, children),
  Space: ({ children }: { children?: ReactNode }) => createElement('div', { 'data-space': 'true' }, children),
}));

vi.mock('@douyinfe/semi-icons', () => ({
  IconCloudStroked: () => createElement('span', null, 'cloud'),
}));

vi.mock('@/i18n', () => ({
  useI18n: () => ({
    t: (key: string) =>
      ((
        {
          'route.formatConvert.title': '格式转换',
          'formatConvert.form.sourceMode': '来源模式',
        } as Record<string, string>
      )[key] || key),
  }),
}));

vi.mock('../convert-type-switch', () => ({
  ConvertTypeSwitch: () => createElement('div', null, 'switch'),
}));

vi.mock('../image-convert-panel', () => ({
  ImageConvertPanel: () => createElement('div', null, 'image-panel'),
}));

vi.mock('../media-convert-panel', () => ({
  MediaConvertPanel: () => createElement('div', null, 'media-panel'),
}));

vi.mock('../../convert-types', () => ({
  getConvertType: () => undefined,
}));

describe('convert task card', () => {
  it('renders its heading without using the Card title prop', async () => {
    const { ConvertTaskCard } = await import('../convert-task-card');

    const markup = renderToStaticMarkup(createElement(ConvertTaskCard, { onCreated: () => undefined }));

    expect(markup).toContain('格式转换');
    expect(markup).toContain('来源模式');
    expect(markup).toContain('data-card-title-provided="false"');
  });
});
