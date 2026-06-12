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
    ...rest
  }: {
    dataSource?: Array<Record<string, unknown>>;
    columns?: Array<{ render?: (_text: unknown, record: Record<string, unknown>) => ReactNode }>;
    rowSelection?: Record<string, unknown>;
    pagination?: {
      currentPage?: number;
      pageSize?: number;
      total?: number;
      formatPageText?: boolean | ((args: { currentStart: number; currentEnd: number; total: number }) => ReactNode);
      [key: string]: unknown;
    };
    [key: string]: unknown;
  }) => (
    (lastTableProps = { dataSource, columns, rowSelection, pagination, ...rest }),
    createElement(
      'div',
      { 'data-table': 'true' },
      typeof pagination?.formatPageText === 'function'
        ? createElement(
            'div',
            { 'data-pagination-summary': 'true' },
            pagination.formatPageText({
              currentStart: ((pagination.currentPage || 1) - 1) * (pagination.pageSize || 10) + 1,
              currentEnd: Math.min((pagination.currentPage || 1) * (pagination.pageSize || 10), pagination.total || 0),
              total: pagination.total || 0,
            })
          )
        : null,
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
      Text: ({
        children,
        ellipsis: _ellipsis,
        link: _link,
        ...props
      }: {
        children?: ReactNode;
        ellipsis?: unknown;
        link?: unknown;
        [key: string]: unknown;
      }) => createElement('span', props, children),
    },
    __getLastTableProps: () => lastTableProps,
    __resetTableProps: () => {
      lastTableProps = undefined;
    },
  };
});

vi.mock('@/i18n', () => ({
  useI18n: () => ({
    t: (key: string, vars?: Record<string, unknown>) =>
      ((
        (
          {
            'formatConvert.browser.currentPath': '当前路径',
            'formatConvert.browser.refresh': '刷新',
            'formatConvert.browser.name': '名称',
            'formatConvert.browser.size': '大小',
            'formatConvert.browser.type': '类型',
            'formatConvert.browser.action': '操作',
            'formatConvert.browser.dir': '目录',
            'formatConvert.browser.file': '文件',
            'formatConvert.browser.select': '选择',
            'formatConvert.browser.paginationSummary': '{{start}}-{{end}} / {{total}}',
            'formatConvert.browser.treeLoading': '正在加载目录列表',
            'formatConvert.browser.treeEmpty': '当前目录暂无可选目录',
          } as Record<string, string>
        )[key] || key
      )
        .replace('{{start}}', String(vars?.start ?? ''))
        .replace('{{end}}', String(vars?.end ?? ''))
        .replace('{{total}}', String(vars?.total ?? ''))),
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

  it('jumps to an ancestor when a current path segment is clicked', async () => {
    mocked.browseFormatConvertOpenlist
      .mockResolvedValueOnce({
        data: {
          path: '/超级超级超级长目录/国产',
          page: 1,
          perPage: 20,
          total: 1,
          content: [
            {
              name: 'episode-01.mp4',
              path: '/超级超级超级长目录/国产/episode-01.mp4',
              isDir: false,
              size: 2048,
            },
          ],
        },
      })
      .mockResolvedValueOnce({
        data: {
          path: '/超级超级超级长目录',
          page: 1,
          perPage: 20,
          total: 1,
          content: [{ name: '国产', path: '/超级超级超级长目录/国产', isDir: true, size: 0 }],
        },
      });

    const { OpenlistTableBrowser } = await import('../openlist-table-browser');

    await act(async () => {
      root.render(createElement(OpenlistTableBrowser, { selectMode: 'file', selectedPaths: [] }));
    });

    const pathStrip = document.querySelector<HTMLElement>('[data-path-strip="true"]');

    expect(pathStrip?.textContent).toContain('超...录');
    expect(pathStrip?.textContent).toContain('国产');
    expect(pathStrip?.style.overflowX).toBe('auto');

    await act(async () => {
      document.querySelector<HTMLElement>('[data-path-segment="/超级超级超级长目录"]')?.click();
    });

    expect(mocked.browseFormatConvertOpenlist).toHaveBeenLastCalledWith({
      path: '/超级超级超级长目录',
      page: 1,
      perPage: 20,
    });
  });

  it('renders directory names as clickable links and files with formatted sizes', async () => {
    mocked.browseFormatConvertOpenlist.mockResolvedValue({
      data: {
        path: '/movies',
        page: 1,
        perPage: 20,
        total: 2,
        content: [
          { name: 'series', path: '/movies/series', isDir: true, size: 0 },
          { name: 'demo.mp4', path: '/movies/demo.mp4', isDir: false, size: 1536 },
        ],
      },
    });

    const { OpenlistTableBrowser } = await import('../openlist-table-browser');

    await act(async () => {
      root.render(createElement(OpenlistTableBrowser, { selectMode: 'file', selectedPaths: [] }));
    });

    const directoryLink = document.querySelector<HTMLElement>('[data-dir-link="/movies/series"]');
    const fileSize = document.querySelector<HTMLElement>('[data-size-cell="/movies/demo.mp4"]');
    const dirSize = document.querySelector<HTMLElement>('[data-size-cell="/movies/series"]');
    const fileName = document.querySelector<HTMLElement>('[data-name-cell="/movies/demo.mp4"]');
    const semi = await import('@douyinfe/semi-ui');
    const tableProps = (
      semi as unknown as { __getLastTableProps: () => Record<string, unknown> }
    ).__getLastTableProps();
    const columns = tableProps.columns as Array<{ width?: number }>;

    expect(directoryLink).not.toBeNull();
    expect(directoryLink?.getAttribute('title')).toBe('series');
    expect(fileSize?.textContent).toBe('1.5 KiB');
    expect(dirSize?.textContent).toBe('-');
    expect(fileName?.style.maxWidth).toBe('640px');
    expect(tableProps.tableLayout).toBe('fixed');
    expect(columns[1]?.width).toBe(96);
  });

  it('renders a compact pagination summary', async () => {
    mocked.browseFormatConvertOpenlist.mockResolvedValue({
      data: {
        path: '/movies',
        page: 2,
        perPage: 20,
        total: 75,
        content: [{ name: 'demo.mp4', path: '/movies/demo.mp4', isDir: false, size: 1536 }],
      },
    });

    const { OpenlistTableBrowser } = await import('../openlist-table-browser');
    const semi = await import('@douyinfe/semi-ui');

    await act(async () => {
      root.render(createElement(OpenlistTableBrowser, { selectMode: 'file', selectedPaths: [] }));
    });

    const tableProps = (
      semi as unknown as { __getLastTableProps: () => Record<string, unknown> }
    ).__getLastTableProps();
    const pagination = tableProps.pagination as {
      formatPageText?: (args: { currentStart: number; currentEnd: number; total: number }) => ReactNode;
      hoverShowPageSelect?: boolean;
      size?: string;
    };

    expect(document.querySelectorAll('[data-pagination-summary="true"]')).toHaveLength(1);
    expect(document.body.textContent).toContain('21-40 / 75');
    expect(pagination.formatPageText?.({ currentStart: 21, currentEnd: 40, total: 75 })).toBe('21-40 / 75');
    expect(pagination.size).toBe('small');
    expect(pagination.hoverShowPageSelect).toBe(true);
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
