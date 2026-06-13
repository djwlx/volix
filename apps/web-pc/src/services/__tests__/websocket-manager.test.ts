import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocked = vi.hoisted(() => ({
  getAuthToken: vi.fn(),
}));

vi.mock('@/utils/auth', () => ({
  getAuthToken: mocked.getAuthToken,
}));

class FakeWebSocket {
  static instances: FakeWebSocket[] = [];

  url: string;
  onopen: ((event: Event) => void) | null = null;
  onclose: ((event: CloseEvent) => void) | null = null;
  onmessage: ((event: MessageEvent<string>) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;

  constructor(url: string) {
    this.url = url;
    FakeWebSocket.instances.push(this);
  }

  close() {
    this.onclose?.({ code: 1000 } as CloseEvent);
  }

  emitOpen() {
    this.onopen?.(new Event('open'));
  }

  emitMessage(data: unknown) {
    this.onmessage?.({
      data: JSON.stringify(data),
    } as MessageEvent<string>);
  }

  emitClose() {
    this.onclose?.({ code: 1006 } as CloseEvent);
  }
}

describe('websocket manager', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    FakeWebSocket.instances = [];
    mocked.getAuthToken.mockReturnValue('token-1');
  });

  it('uses the current auth token in the websocket query and dispatches parsed events', async () => {
    const { createWebsocketManager } = await import('../websocket-manager');
    const manager = createWebsocketManager({
      createSocket: url => new FakeWebSocket(url) as never,
      getLocation: () => ({ protocol: 'https:', host: 'volix.test' }),
      reconnectDelaysMs: [10],
    });

    const taskHandler = vi.fn();
    const stateHandler = vi.fn();
    manager.subscribe('format-convert.task.updated', taskHandler);
    manager.subscribe('ws.connection.changed', stateHandler);

    await manager.connect();

    expect(mocked.getAuthToken).toHaveBeenCalledTimes(1);
    expect(FakeWebSocket.instances[0]?.url).toBe('wss://volix.test/ws?token=token-1');

    FakeWebSocket.instances[0]?.emitOpen();
    FakeWebSocket.instances[0]?.emitMessage({
      id: 'ready-1',
      event: 'ws.connection.ready',
      ts: '2026-06-13T00:00:00.000Z',
      data: { heartbeatMs: 25_000, serverTime: '2026-06-13T00:00:00.000Z' },
    });
    FakeWebSocket.instances[0]?.emitMessage({
      id: 'task-1',
      event: 'format-convert.task.updated',
      ts: '2026-06-13T00:00:01.000Z',
      data: { taskId: 1, status: 'completed' },
    });

    expect(taskHandler).toHaveBeenCalledWith({
      taskId: 1,
      status: 'completed',
    });
    expect(stateHandler).toHaveBeenNthCalledWith(1, 'connecting');
    expect(stateHandler).toHaveBeenNthCalledWith(2, 'connected');
  });

  it('coalesces concurrent connect calls into a single socket attempt', async () => {
    const { createWebsocketManager } = await import('../websocket-manager');
    const manager = createWebsocketManager({
      createSocket: url => new FakeWebSocket(url) as never,
      getLocation: () => ({ protocol: 'https:', host: 'volix.test' }),
      reconnectDelaysMs: [10],
    });

    const first = manager.connect();
    const second = manager.connect();

    await Promise.all([first, second]);

    expect(FakeWebSocket.instances).toHaveLength(1);
    expect(mocked.getAuthToken).toHaveBeenCalledTimes(1);
  });

  it('switches to reconnecting after an unexpected close', async () => {
    const { createWebsocketManager } = await import('../websocket-manager');
    const manager = createWebsocketManager({
      createSocket: url => new FakeWebSocket(url) as never,
      getLocation: () => ({ protocol: 'http:', host: 'volix.test' }),
      reconnectDelaysMs: [10],
    });

    const stateHandler = vi.fn();
    manager.subscribe('ws.connection.changed', stateHandler);

    await manager.connect();
    FakeWebSocket.instances[0]?.emitOpen();
    FakeWebSocket.instances[0]?.emitMessage({
      id: 'ready-1',
      event: 'ws.connection.ready',
      ts: '2026-06-13T00:00:00.000Z',
      data: { heartbeatMs: 25_000, serverTime: '2026-06-13T00:00:00.000Z' },
    });

    FakeWebSocket.instances[0]?.emitClose();
    await vi.advanceTimersByTimeAsync(10);

    expect(stateHandler).toHaveBeenNthCalledWith(3, 'reconnecting');
  });
});
