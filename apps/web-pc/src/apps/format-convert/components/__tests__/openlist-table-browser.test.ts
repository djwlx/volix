// @vitest-environment jsdom

import { act, createElement } from 'react';
import type { ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocked = vi.hoisted(() => ({
  browseFormatConvertOpenlist: vi.fn(),
  toastError: vi.fn(),
}));

vi.mock('@douyinfe/semi-ui', () => {
  let lastTableProps: Record<string, unknown> | undefined;

  const Button = ({
    children,
    onClick,
    disabled,
    icon,
  }: {
    children?: ReactNode;
    onClick?: () => void;
    disabled?: boolean;
    icon?: ReactNode;
  }) => createElement('button', { disabled, onClick }, icon, children);

  const Empty = ({ title }: { title?: ReactNode }) => createElement('div', { 'data-empty': 'true' }, title);
  const Spin = ({ children }: { children?: ReactNode }) => createElement('div', null, children);

  const Table = ({
    dataSource,
    columns,
    rowSelection,
    pagination,
  }: {
    dataSource?: Array<Record<string, unknown>>;
    columns?: Array<{ render?: (_text: unknown, record: Record<string, unknown>) => ReactNode }>;
    rowSelection?: Record<string, unknown>;
    pagination?: Record<string, unknown>;
  }) => (
    (lastTableProps = { dataSource, columns, rowSelection, pagination }),
    createElement(
      'div',
      { 'data-table': 'true' },
      (dataSource || []).map(record =>
        createElement(
          'article',
          { key: String(record.path) },
          (columns || []).map((column, index) =>
            createElement('div', { key: `${record.path}-${index}` }, column.render?.(undefined, record))
          )
        )
      )
    )
  );

  return {
    Button,
    Empty,
    Spin,
    Table,
    Toast: {
      error: mocked.toastError,
    },
    Typography: {
      Text: ({ children }: { children?: ReactNode }) => createElement('span', null, children),
    },
    __getLastTableProps: () => lastTableProps,
    __resetTableProps: () => {
      lastTableProps = undefined;
    },
  };
});

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
          'formatConvert.browser.dir': '目录',
          'formatConvert.browser.file': '文件',
          'formatConvert.browser.select': '选择',
          'formatConvert.browser.treeLoading': '正在加载目录列表',
          'formatConvert.browser.treeEmpty': '当前目录暂无可选目录',
        } as Record<string, string>
      )[key] || key),
  }),
}));

vi.mock('@/services/format-convert', () => ({
  browseFormatConvertOpenlist: mocked.browseFormatConvertOpenlist,
}));

describe('openlist table browser', () => {
  let container: HTMLDivElement;
  let root: ReturnType<typeof createRoot>;

  beforeEach(async () => {
    (globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    mocked.browseFormatConvertOpenlist.mockReset();
    mocked.toastError.mockReset();
    const semi = await import('@douyinfe/semi-ui');
    (semi as unknown as { __resetTableProps: () => void }).__resetTableProps();
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

  it('renders a table for the current path', async () => {
    mocked.browseFormatConvertOpenlist.mockResolvedValue({
      data: {
        path: '/movies',
        page: 1,
        perPage: 20,
        total: 2,
        content: [
          { name: 'series', path: '/movies/series', isDir: true, size: 0 },
          { name: 'demo.mp4', path: '/movies/demo.mp4', isDir: false, size: 12 },
        ],
      },
    });

    const { OpenlistTableBrowser } = await import('../openlist-table-browser');

    await act(async () => {
      root.render(createElement(OpenlistTableBrowser, { selectMode: 'file', selectedPaths: [] }));
    });

    expect(mocked.browseFormatConvertOpenlist).toHaveBeenCalledWith({
      path: '/',
      page: 1,
      perPage: 20,
    });
    expect(document.querySelector('[data-table="true"]')).not.toBeNull();
    expect(document.body.textContent).toContain('series');
    expect(document.body.textContent).toContain('demo.mp4');
  });

  it('reloads the current path when the page changes', async () => {
    mocked.browseFormatConvertOpenlist.mockImplementation(({ page }: { page?: number }) =>
      Promise.resolve({
        data: {
          path: '/movies',
          page: page || 1,
          perPage: 20,
          total: 25,
          content: [{ name: 'demo.mp4', path: '/movies/demo.mp4', isDir: false, size: 12 }],
        },
      })
    );

    const { OpenlistTableBrowser } = await import('../openlist-table-browser');
    const semi = await import('@douyinfe/semi-ui');

    await act(async () => {
      root.render(createElement(OpenlistTableBrowser, { selectMode: 'file', selectedPaths: [] }));
    });

    const tableProps = (
      semi as unknown as { __getLastTableProps: () => Record<string, unknown> }
    ).__getLastTableProps();
    const pagination = tableProps.pagination as { onPageChange?: (page: number) => void };

    await act(async () => {
      pagination.onPageChange?.(2);
    });

    expect(mocked.browseFormatConvertOpenlist).toHaveBeenLastCalledWith({
      path: '/movies',
      page: 2,
      perPage: 20,
    });
  });

  it('keeps the latest navigation result when requests resolve out of order', async () => {
    let resolvePage2: ((value: unknown) => void) | undefined;
    let resolvePage1Refresh: ((value: unknown) => void) | undefined;

    mocked.browseFormatConvertOpenlist
      .mockResolvedValueOnce({
        data: {
          path: '/movies',
          page: 1,
          perPage: 20,
          total: 21,
          content: [{ name: 'page-one.mp4', path: '/movies/page-one.mp4', isDir: false, size: 12 }],
        },
      })
      .mockImplementationOnce(
        () =>
          new Promise(resolve => {
            resolvePage2 = resolve;
          })
      )
      .mockImplementationOnce(
        () =>
          new Promise(resolve => {
            resolvePage1Refresh = resolve;
          })
      );

    const { OpenlistTableBrowser } = await import('../openlist-table-browser');
    const semi = await import('@douyinfe/semi-ui');

    await act(async () => {
      root.render(createElement(OpenlistTableBrowser, { selectMode: 'file', selectedPaths: [] }));
    });

    const tableProps = (
      semi as unknown as { __getLastTableProps: () => Record<string, unknown> }
    ).__getLastTableProps();
    const pagination = tableProps.pagination as { onPageChange?: (page: number) => void };

    await act(async () => {
      pagination.onPageChange?.(2);
    });

    await act(async () => {
      pagination.onPageChange?.(1);
    });

    await act(async () => {
      resolvePage1Refresh?.({
        data: {
          path: '/movies',
          page: 1,
          perPage: 20,
          total: 21,
          content: [{ name: 'fresh-page-one.mp4', path: '/movies/fresh-page-one.mp4', isDir: false, size: 12 }],
        },
      });
      await Promise.resolve();
    });

    await act(async () => {
      resolvePage2?.({
        data: {
          path: '/movies',
          page: 2,
          perPage: 20,
          total: 21,
          content: [{ name: 'page-two.mp4', path: '/movies/page-two.mp4', isDir: false, size: 12 }],
        },
      });
      await Promise.resolve();
    });

    expect(document.body.textContent).toContain('fresh-page-one.mp4');
    expect(document.body.textContent).not.toContain('page-two.mp4');
  });

  it('reflects controlled selected paths in row selection', async () => {
    mocked.browseFormatConvertOpenlist.mockResolvedValue({
      data: {
        path: '/movies',
        page: 1,
        perPage: 20,
        total: 2,
        content: [
          { name: 'series', path: '/movies/series', isDir: true, size: 0 },
          { name: 'demo.mp4', path: '/movies/demo.mp4', isDir: false, size: 12 },
        ],
      },
    });

    const { OpenlistTableBrowser } = await import('../openlist-table-browser');
    const semi = await import('@douyinfe/semi-ui');

    await act(async () => {
      root.render(
        createElement(OpenlistTableBrowser, {
          selectMode: 'file',
          selectedPaths: ['/movies/demo.mp4'],
        })
      );
    });

    const tableProps = (
      semi as unknown as { __getLastTableProps: () => Record<string, unknown> }
    ).__getLastTableProps();
    const rowSelection = tableProps.rowSelection as { selectedRowKeys?: string[] };

    expect(rowSelection.selectedRowKeys).toEqual(['/movies/demo.mp4']);
  });

  it('prefers the newly added file in single selection mode', async () => {
    mocked.browseFormatConvertOpenlist.mockResolvedValue({
      data: {
        path: '/movies',
        page: 1,
        perPage: 20,
        total: 2,
        content: [
          { name: 'first.mp4', path: '/movies/first.mp4', isDir: false, size: 12 },
          { name: 'second.mp4', path: '/movies/second.mp4', isDir: false, size: 12 },
        ],
      },
    });

    const { OpenlistTableBrowser } = await import('../openlist-table-browser');
    const semi = await import('@douyinfe/semi-ui');
    const onFileSelectionChange = vi.fn();

    await act(async () => {
      root.render(
        createElement(OpenlistTableBrowser, {
          selectMode: 'file',
          selectionMode: 'single',
          selectedPaths: ['/movies/first.mp4'],
          onFileSelectionChange,
        })
      );
    });

    const tableProps = (
      semi as unknown as { __getLastTableProps: () => Record<string, unknown> }
    ).__getLastTableProps();
    const rowSelection = tableProps.rowSelection as { onChange?: (paths: string[]) => void };

    await act(async () => {
      rowSelection.onChange?.(['/movies/second.mp4', '/movies/first.mp4']);
    });

    expect(onFileSelectionChange).toHaveBeenCalledWith([{ path: '/movies/second.mp4', name: 'second.mp4' }]);
  });

  it('collects directories from later mixed pages in dir mode', async () => {
    mocked.browseFormatConvertOpenlist
      .mockResolvedValueOnce({
        data: {
          path: '/movies',
          page: 1,
          perPage: 20,
          total: 4,
          content: [
            { name: 'series', path: '/movies/series', isDir: true, size: 0 },
            { name: 'demo.mp4', path: '/movies/demo.mp4', isDir: false, size: 12 },
          ],
        },
      })
      .mockResolvedValueOnce({
        data: {
          path: '/movies',
          page: 2,
          perPage: 20,
          total: 4,
          content: [
            { name: 'clip.mp4', path: '/movies/clip.mp4', isDir: false, size: 12 },
            { name: 'archive', path: '/movies/archive', isDir: true, size: 0 },
          ],
        },
      });

    const { OpenlistTableBrowser } = await import('../openlist-table-browser');
    const semi = await import('@douyinfe/semi-ui');

    await act(async () => {
      root.render(createElement(OpenlistTableBrowser, { selectMode: 'dir', selectedDirPath: '/movies' }));
    });

    const tableProps = (
      semi as unknown as { __getLastTableProps: () => Record<string, unknown> }
    ).__getLastTableProps();
    const dataSource = tableProps.dataSource as Array<{ path: string }>;

    expect(dataSource).toEqual([
      { name: 'series', path: '/movies/series', isDir: true, size: 0 },
      { name: 'archive', path: '/movies/archive', isDir: true, size: 0 },
    ]);
  });
});
