// @vitest-environment jsdom

import { act, createElement } from 'react';
import type { ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocked = vi.hoisted(() => ({
  get115PicInfo: vi.fn(),
  clear115Pic: vi.fn(),
  retry115Pic: vi.fn(),
  set115PicRandomCacheConfig: vi.fn(),
  requestNavigate: vi.fn(),
}));

vi.mock('@douyinfe/semi-ui', () => ({
  Button: ({ children, onClick, disabled }: { children?: ReactNode; onClick?: () => void; disabled?: boolean }) =>
    createElement('button', { disabled, onClick }, children),
  Descriptions: () => createElement('div', null, 'descriptions'),
  Form: Object.assign(
    ({
      children,
      getFormApi,
    }: {
      children?: () => ReactNode;
      getFormApi?: (api: {
        getTouched: () => boolean;
        setValues: () => void;
        setTouched: () => void;
        submitForm: () => void;
      }) => void;
    }) => {
      getFormApi?.({
        getTouched: () => false,
        setValues: () => undefined,
        setTouched: () => undefined,
        submitForm: () => undefined,
      });
      return createElement('form', null, children?.());
    },
    {
      Input: () => createElement('input'),
      InputNumber: () => createElement('input', { type: 'number' }),
    }
  ),
  Popconfirm: ({ children }: { children?: ReactNode }) => createElement('div', null, children),
  Space: ({ children }: { children?: ReactNode }) => createElement('div', null, children),
  Table: ({
    columns,
    dataSource,
  }: {
    columns: Array<{ key?: string; render?: (value: unknown, record: Record<string, unknown>) => ReactNode }>;
    dataSource: Array<Record<string, unknown>>;
  }) =>
    createElement(
      'div',
      null,
      dataSource.map((record, index) =>
        createElement(
          'div',
          { key: String(record.cid || index) },
          columns.map((column, columnIndex) =>
            createElement('div', { key: `${index}-${column.key || columnIndex}` }, column.render?.(undefined, record))
          )
        )
      )
    ),
  Tag: ({ children }: { children?: ReactNode }) => createElement('span', null, children),
  Toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
  Typography: {
    Text: ({ children }: { children?: ReactNode }) => createElement('span', null, children),
  },
}));

vi.mock('@douyinfe/semi-icons', () => ({
  IconDelete: () => createElement('span', null, 'delete'),
}));

vi.mock('@/services/115', () => ({
  clear115Pic: mocked.clear115Pic,
  get115PicInfo: mocked.get115PicInfo,
  retry115Pic: mocked.retry115Pic,
  set115PicRandomCacheConfig: mocked.set115PicRandomCacheConfig,
}));

vi.mock('@/utils/error', () => ({
  getHttpErrorMessage: () => 'error',
}));

vi.mock('@/i18n', () => ({
  useI18n: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock('@/hooks', () => ({
  useAppPageContext: () => ({
    requestNavigate: mocked.requestNavigate,
  }),
}));

vi.mock('../components', () => ({
  FilePath: ({ path }: { path: string }) => createElement('span', null, path),
}));

vi.mock('../pic-cache-status', () => ({
  picCacheStatusOrder: {
    pending: 0,
    caching: 1,
    cached: 2,
    failed: 3,
    partial: 4,
  },
  renderPicCacheStatusTag: ({ status }: { status: string }) => createElement('span', null, status),
}));

vi.mock('../pic-setting-stats', () => ({
  buildPicSettingStatsData: () => [],
}));

vi.mock('../pic-realtime', () => ({
  subscribeToPic115InfoEvents: () => () => undefined,
}));

vi.mock('@/services/websocket-event-bus', () => ({
  websocketEventBus: {
    connect: vi.fn(),
  },
}));

describe('pic setting random action', () => {
  let container: HTMLDivElement;
  let root: ReturnType<typeof createRoot>;

  beforeEach(() => {
    mocked.requestNavigate.mockReset();
    mocked.get115PicInfo.mockResolvedValue({
      code: 0,
      data: {
        count: 1,
        loading: false,
        folders: [
          {
            cid: 'folder-1',
            status: 'cached',
            count: 1,
          },
        ],
        randomCacheConfig: {
          sourceWeights: {
            local: 50,
            cloud: 50,
          },
          localMaxSizeMb: 2048,
          randomNoRepeatWindowMinutes: 5,
          randomNoRepeatMaxCount: 50,
          cloudProxyUrl: '',
          autoPlayIntervalSeconds: 10,
        },
        randomCacheStats: {
          localFileCount: 1,
          localTotalSizeMb: 1,
          localLimitExceeded: false,
        },
      },
    });

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

  it('renders cache-folder random action and navigates to pic page with cid query', async () => {
    const { PicSetting } = await import('../pic-setting');

    await act(async () => {
      root.render(createElement(PicSetting));
    });

    const randomButton = Array.from(container.querySelectorAll('button')).find(
      button => button.textContent === 'pic115.action.random'
    );

    expect(randomButton).toBeTruthy();

    await act(async () => {
      randomButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(mocked.requestNavigate).toHaveBeenCalledWith('/pic?cid=folder-1');
  });
});
