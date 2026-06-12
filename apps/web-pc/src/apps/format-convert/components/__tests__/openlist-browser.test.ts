// @vitest-environment jsdom

import { act, createElement } from 'react';
import type { ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@douyinfe/semi-ui', () => ({
  Button: ({ children, onClick, disabled }: { children?: ReactNode; onClick?: () => void; disabled?: boolean }) =>
    createElement('button', { disabled, onClick }, children),
  Modal: ({
    title,
    children,
    footer,
    visible,
  }: {
    title?: ReactNode;
    children?: ReactNode;
    footer?: ReactNode;
    visible?: boolean;
  }) => (visible ? createElement('section', null, title, children, footer) : null),
  Space: ({ children }: { children?: ReactNode }) => createElement('div', null, children),
  Typography: {
    Text: ({ children }: { children?: ReactNode }) => createElement('span', null, children),
  },
}));

vi.mock('@/i18n', () => ({
  useI18n: () => ({
    t: (key: string) =>
      ((
        {
          'formatConvert.browser.confirmDir': '选择该目录',
        } as Record<string, string>
      )[key] || key),
  }),
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

describe('openlist browser', () => {
  let container: HTMLDivElement;
  let root: ReturnType<typeof createRoot>;

  beforeEach(() => {
    (globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
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

  it('confirms the current directory from the shared browser in dir mode', async () => {
    const { OpenlistBrowser } = await import('../openlist-browser');
    const browserModule = await import('../openlist-table-browser');
    const onSelect = vi.fn();

    await act(async () => {
      root.render(
        createElement(OpenlistBrowser, {
          open: true,
          selectMode: 'dir',
          title: '选择保存目录',
          onCancel: () => undefined,
          onSelect,
        })
      );
    });

    const browserProps = (
      browserModule as unknown as { __getLastBrowserProps: () => Record<string, unknown> }
    ).__getLastBrowserProps();

    expect(document.querySelector('[data-browser="true"]')).not.toBeNull();

    await act(async () => {
      (browserProps.onDirSelectionChange as (path: string) => void)('/target');
    });

    await act(async () => {
      const confirmButton = Array.from(document.querySelectorAll('button')).find(
        item => item.textContent === '选择该目录'
      );
      confirmButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(onSelect).toHaveBeenCalledWith({ path: '/target', name: '/target' });
  });

  it('forwards the selected file from the shared browser in file mode', async () => {
    const { OpenlistBrowser } = await import('../openlist-browser');
    const browserModule = await import('../openlist-table-browser');
    const onSelect = vi.fn();

    await act(async () => {
      root.render(
        createElement(OpenlistBrowser, {
          open: true,
          selectMode: 'file',
          title: '选择源文件',
          onCancel: () => undefined,
          onSelect,
        })
      );
    });

    const browserProps = (
      browserModule as unknown as { __getLastBrowserProps: () => Record<string, unknown> }
    ).__getLastBrowserProps();

    await act(async () => {
      (browserProps.onFileSelectionChange as (items: Array<{ path: string; name: string }>) => void)([
        { path: '/movie.mp4', name: 'movie.mp4' },
      ]);
    });

    expect(onSelect).toHaveBeenCalledWith({ path: '/movie.mp4', name: 'movie.mp4' });
  });
});
