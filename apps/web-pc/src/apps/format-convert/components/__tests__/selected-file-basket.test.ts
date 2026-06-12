import { createElement } from 'react';
import type { ReactNode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@douyinfe/semi-ui', () => ({
  Button: ({ icon, children }: { icon?: ReactNode; children?: ReactNode }) =>
    createElement('button', null, icon, children),
  Empty: ({ title }: { title?: ReactNode }) => createElement('div', null, title),
  Space: ({ children }: { children?: ReactNode }) => createElement('div', { 'data-space': 'true' }, children),
  Progress: ({ percent }: { percent?: number }) => createElement('div', { 'data-progress': 'true' }, `${percent}%`),
  Spin: () => createElement('div', { 'data-spin': 'true' }, 'spin'),
  Typography: {
    Title: ({ children }: { children?: ReactNode }) => createElement('h3', null, children),
  },
}));

vi.mock('@douyinfe/semi-icons', () => ({
  IconDeleteStroked: () => createElement('span', null, 'delete'),
  IconTickCircle: () => createElement('span', null, 'check'),
  IconAlertCircle: () => createElement('span', null, 'error'),
}));

vi.mock('@/i18n', () => ({
  useI18n: () => ({
    t: (key: string, params?: Record<string, unknown>) =>
      ((
        {
          'formatConvert.basket.title': '已选文件',
          'formatConvert.basket.summary': `共 ${params?.count ?? 0} 个文件`,
          'formatConvert.basket.clear': '清空全部',
          'formatConvert.basket.emptyTitle': '还没有加入文件',
        } as Record<string, string>
      )[key] || key),
  }),
}));

describe('selected file basket', () => {
  it('renders the scroll list directly without an extra Space wrapper', async () => {
    const { SelectedFileBasket } = await import('../selected-file-basket');

    const markup = renderToStaticMarkup(
      createElement(SelectedFileBasket, {
        items: [{ key: '1', primary: 'demo.mp4', secondary: 'video/mp4 · 1 MB' }],
        onClear: () => undefined,
        onRemove: () => undefined,
      })
    );

    expect(markup).toContain('demo.mp4');
    expect(markup).toContain('delete');
    expect(markup).not.toContain('data-space="true"');
  });

  it('shows upload status indicators and hides the per-item delete button while uploading', async () => {
    const { SelectedFileBasket } = await import('../selected-file-basket');

    const markup = renderToStaticMarkup(
      createElement(SelectedFileBasket, {
        uploading: true,
        items: [
          { key: '1', primary: 'a.mp4', uploadStatus: 'success', uploadPercent: 100 },
          { key: '2', primary: 'b.mp4', uploadStatus: 'uploading', uploadPercent: 42 },
          { key: '3', primary: 'c.mp4', uploadStatus: 'pending', uploadPercent: 0 },
        ],
        onClear: () => undefined,
        onRemove: () => undefined,
      })
    );

    expect(markup).toContain('check');
    expect(markup).toContain('42%');
    expect(markup).toContain('spin');
    expect(markup).not.toContain('delete');
    expect(markup).not.toContain('清空全部');
  });
});
