import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocked = vi.hoisted(() => ({
  emitWebsocketEventToUser: vi.fn(),
}));

vi.mock('../../../shared/websocket/ws-server', () => ({
  emitWebsocketEventToUser: mocked.emitWebsocketEventToUser,
}));

describe('format convert realtime events', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('emits task.updated with the public task shape', async () => {
    const { emitFormatConvertTaskUpdated } = await import('../format-convert-task-realtime.service.js');

    await emitFormatConvertTaskUpdated({
      id: 1,
      userId: 'u1',
      status: 'completed',
      requestUserAgent: 'internal-agent',
    } as never);

    expect(mocked.emitWebsocketEventToUser).toHaveBeenCalledWith(
      'u1',
      'format-convert.task.updated',
      expect.objectContaining({
        id: 1,
        status: 'completed',
      })
    );
    expect(mocked.emitWebsocketEventToUser.mock.calls[0]?.[2]).not.toHaveProperty('requestUserAgent');
  });
});
