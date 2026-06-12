// @vitest-environment jsdom

import { act, createElement } from 'react';
import type { ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocked = vi.hoisted(() => ({
  browseFormatConvertOpenlist: vi.fn(),
  toastError: vi.fn(),
}));

vi.mock('@douyinfe/semi-ui', () => ({
  Button: ({ children }: { children?: ReactNode }) => createElement('button', null, children),
  Checkbox: ({ children }: { children?: ReactNode }) => createElement('label', null, children),
  Empty: ({ title }: { title?: ReactNode }) => createElement('div', null, title),
  Spin: ({ children }: { children?: ReactNode }) => createElement('div', null, children),
  Toast: {
    error: mocked.toastError,
  },
  Tree: () => createElement('div', { 'data-tree': 'true' }),
  Typography: {
    Title: ({ children }: { children?: ReactNode }) => createElement('h2', null, children),
  },
}));

vi.mock('@/i18n', () => ({
  useI18n: () => ({
    t: (key: string, params?: Record<string, unknown>) => {
      const raw =
        (
          {
            'formatConvert.cloud.sourceTreeTitle': 'OpenList 文件浏览器',
            'formatConvert.cloud.sourceTreeHint': '进入目录后勾选文件',
            'formatConvert.cloud.sourceTreeSelectedHint': '当前已勾选 {{count}} 个云文件',
            'formatConvert.browser.refresh': '刷新',
          } as Record<string, string>
        )[key] || key;
      return params ? raw.replace(/{{(\w+)}}/g, (_match, name: string) => String(params[name] ?? '')) : raw;
    },
  }),
}));

vi.mock('@/services/format-convert', () => ({
  browseFormatConvertOpenlist: mocked.browseFormatConvertOpenlist,
}));

vi.mock('../openlist-table-browser', () => {
  let lastProps: Record<string, unknown> | undefined;

  return {
    OpenlistTableBrowser: (props: Record<string, unknown>) => (
      (lastProps = props), createElement('div', { 'data-browser': 'true' })
    ),
    __getLastBrowserProps: () => lastProps,
  };
});

describe('cloud source tree', () => {
  let container: HTMLDivElement;
  let root: ReturnType<typeof createRoot>;

  beforeEach(() => {
    (globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    mocked.browseFormatConvertOpenlist.mockReset();
    mocked.toastError.mockReset();
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(async () => {
    await act(async () => {
      root.unmount();
    });
    container.remove();
    document.body.innerHTML = '';
  });

  it('keeps existing selections when the shared browser adds a file from another directory', async () => {
    const { CloudSourceTree } = await import('../cloud-source-tree');
    const browserModule = await import('../openlist-table-browser');
    const onSelectionChange = vi.fn();

    await act(async () => {
      root.render(
        createElement(CloudSourceTree, {
          selected: {
            '/anime/ep1.mkv': { path: '/anime/ep1.mkv', name: 'ep1.mkv' },
          },
          onSelectionChange,
        })
      );
    });

    const browserProps = (
      browserModule as unknown as { __getLastBrowserProps: () => Record<string, unknown> }
    ).__getLastBrowserProps();

    expect(browserProps.selectedPaths).toEqual(['/anime/ep1.mkv']);

    await act(async () => {
      (browserProps.onFileSelectionChange as (items: Array<{ path: string; name: string }>) => void)([
        { path: '/anime/ep1.mkv', name: 'ep1.mkv' },
        { path: '/anime/season-2/ep2.mkv', name: 'ep2.mkv' },
      ]);
    });

    expect(onSelectionChange).toHaveBeenCalledWith({
      '/anime/ep1.mkv': { path: '/anime/ep1.mkv', name: 'ep1.mkv' },
      '/anime/season-2/ep2.mkv': { path: '/anime/season-2/ep2.mkv', name: 'ep2.mkv' },
    });
  });
});
