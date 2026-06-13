// @vitest-environment jsdom

import { act, createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocked = vi.hoisted(() => ({
  getFormatConvertTasks: vi.fn(),
  deleteFormatConvertTask: vi.fn(),
  deleteFormatConvertTasks: vi.fn(),
  retryFormatConvertTask: vi.fn(),
  connect: vi.fn(),
  getState: vi.fn(() => 'connected'),
  subscribeToFormatConvertTaskEvents: vi.fn(),
  taskRecordListProps: undefined as Record<string, unknown> | undefined,
  realtimeHandlers: undefined as
    | {
        onCreated: (task: unknown) => void;
        onUpdated: (task: unknown) => void;
        onDeleted: (taskId: number) => void;
        onReconnect: () => void;
      }
    | undefined,
}));

vi.mock('@douyinfe/semi-ui', () => ({
  Toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

vi.mock('@/i18n', () => ({
  useI18n: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock('@/utils/error', () => ({
  getHttpErrorMessage: () => 'error',
}));

vi.mock('@/services/format-convert', () => ({
  getFormatConvertTasks: mocked.getFormatConvertTasks,
  deleteFormatConvertTask: mocked.deleteFormatConvertTask,
  deleteFormatConvertTasks: mocked.deleteFormatConvertTasks,
  retryFormatConvertTask: mocked.retryFormatConvertTask,
}));

vi.mock('@/services/websocket-event-bus', () => ({
  websocketEventBus: {
    connect: mocked.connect,
    getState: mocked.getState,
  },
}));

vi.mock('../format-convert-realtime', () => ({
  subscribeToFormatConvertTaskEvents: (handlers: typeof mocked.realtimeHandlers) => {
    mocked.subscribeToFormatConvertTaskEvents(handlers);
    mocked.realtimeHandlers = handlers || undefined;
    return () => undefined;
  },
}));

vi.mock('../components', () => ({
  ConvertTaskCard: ({ onCreated }: { onCreated?: () => void }) =>
    createElement('button', { onClick: onCreated }, 'create'),
  TaskRecordList: (props: Record<string, unknown>) => (
    (mocked.taskRecordListProps = props), createElement('section', null, props.tasks ? JSON.stringify(props.tasks) : '')
  ),
}));

describe('format convert app realtime', () => {
  let container: HTMLDivElement;
  let root: ReturnType<typeof createRoot>;

  beforeEach(() => {
    mocked.getFormatConvertTasks.mockResolvedValue({
      data: {
        items: [{ id: 1, status: 'pending' }],
      },
    });
    mocked.deleteFormatConvertTask.mockResolvedValue({ data: { success: true } });
    mocked.deleteFormatConvertTasks.mockResolvedValue({ data: { success: true, deletedCount: 1 } });
    mocked.retryFormatConvertTask.mockResolvedValue({ data: { success: true } });
    mocked.taskRecordListProps = undefined;
    mocked.realtimeHandlers = undefined;
    mocked.connect.mockReset();
    mocked.connect.mockResolvedValue(undefined);

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

  it('loads once and subscribes to realtime updates without starting an interval', async () => {
    const setIntervalSpy = vi.spyOn(window, 'setInterval');
    const { default: FormatConvertApp } = await import('../index');

    await act(async () => {
      root.render(createElement(FormatConvertApp));
    });

    expect(setIntervalSpy).not.toHaveBeenCalled();
    expect(mocked.getFormatConvertTasks).toHaveBeenCalledTimes(1);
    expect(mocked.connect).toHaveBeenCalledTimes(1);
    expect(mocked.subscribeToFormatConvertTaskEvents).toHaveBeenCalledTimes(1);
  });

  it('applies realtime updates to the rendered task list', async () => {
    const { default: FormatConvertApp } = await import('../index');

    await act(async () => {
      root.render(createElement(FormatConvertApp));
    });

    await act(async () => {
      mocked.realtimeHandlers?.onUpdated({ id: 1, status: 'completed' });
      mocked.realtimeHandlers?.onCreated({ id: 2, status: 'pending' });
      mocked.realtimeHandlers?.onDeleted(1);
    });

    expect((mocked.taskRecordListProps?.tasks as Array<{ id: number }>).map(task => task.id)).toEqual([2]);
  });
});
