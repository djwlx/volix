import { createElement } from 'react';
import type { ReactNode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@douyinfe/semi-ui', () => ({
  Button: ({ children }: { children?: ReactNode }) => createElement('button', null, children),
  Empty: ({ title }: { title?: ReactNode }) => createElement('div', { 'data-empty': 'true' }, title),
  Input: ({ value }: { value?: string }) => createElement('input', { value }),
  Modal: ({ title, children, footer }: { title?: ReactNode; children?: ReactNode; footer?: ReactNode }) =>
    createElement('section', null, title, children, footer),
  Space: ({ children }: { children?: ReactNode }) => createElement('div', null, children),
  Spin: ({ children }: { children?: ReactNode }) => createElement('div', null, children),
  Table: ({ columns }: { columns?: Array<{ title: string }> }) =>
    createElement('div', { 'data-table': 'true' }, columns?.map(column => column.title).join('|')),
  Tree: () => createElement('div', { 'data-tree': 'true' }),
  Typography: {
    Text: ({ children }: { children?: ReactNode }) => createElement('span', null, children),
  },
}));

vi.mock('@/i18n', () => ({
  useI18n: () => ({
    t: (key: string) =>
      ((
        {
          'formatConvert.browser.currentPath': '当前路径',
          'formatConvert.browser.refresh': '刷新',
          'formatConvert.browser.name': '名称',
          'formatConvert.browser.type': '类型',
          'formatConvert.browser.action': '操作',
          'formatConvert.browser.selectCurrent': '选择当前目录',
          'formatConvert.browser.treeEmpty': '当前目录暂无可选子目录',
          'formatConvert.browser.selectedDir': '当前选中目录：/',
          'formatConvert.browser.confirmDir': '选择该目录',
        } as Record<string, string>
      )[key] || key),
  }),
}));

describe('openlist browser', () => {
  it('renders tree picker instead of table columns for directory mode', async () => {
    const { OpenlistBrowser } = await import('../openlist-browser');

    const markup = renderToStaticMarkup(
      createElement(OpenlistBrowser, {
        open: true,
        selectMode: 'dir',
        title: '选择保存目录',
        onCancel: () => undefined,
        onSelect: () => undefined,
      })
    );

    expect(markup).not.toContain('data-table="true"');
    expect(markup).not.toContain('名称');
    expect(markup).not.toContain('类型');
    expect(markup).not.toContain('操作');
    expect(markup).toContain('当前目录暂无可选子目录');
    expect(markup).toContain('选择该目录');
  });
});
