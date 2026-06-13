import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocked = vi.hoisted(() => ({
  getData: vi.fn(),
  queryUser: vi.fn(),
}));

vi.mock('../../../../utils/jwt', () => ({
  default: {
    getData: mocked.getData,
  },
}));

vi.mock('../../../user', () => ({
  queryUser: mocked.queryUser,
}));

describe('websocket server registry', () => {
  beforeEach(() => {
    mocked.getData.mockReturnValue({ id: 'u1' });
    mocked.queryUser.mockResolvedValue({
      dataValues: {
        id: 'u1',
        email: 'u1@example.com',
      },
    });
  });

  it('emits only to sockets registered for the matching user', async () => {
    const { createWebsocketConnectionRegistry, emitWsMessage } = await import('../ws-server.js');

    const sentA: unknown[] = [];
    const sentB: unknown[] = [];
    const registry = createWebsocketConnectionRegistry();

    registry.add('u1', { send: (payload: string) => sentA.push(JSON.parse(payload)), close: () => undefined } as never);
    registry.add('u2', { send: (payload: string) => sentB.push(JSON.parse(payload)), close: () => undefined } as never);

    emitWsMessage(registry, 'u1', 'format-convert.task.updated', { taskId: 1 });

    expect(sentA).toHaveLength(1);
    expect(sentB).toHaveLength(0);
    expect(sentA[0]).toMatchObject({
      event: 'format-convert.task.updated',
      data: { taskId: 1 },
    });
  });

  it('resolves a websocket user id from the auth token query', async () => {
    const { resolveWebsocketUserId } = await import('../ws-server.js');

    await expect(resolveWebsocketUserId({ url: '/ws?token=token-1' } as never)).resolves.toBe('u1');
    expect(mocked.getData).toHaveBeenCalledWith('token-1');
    expect(mocked.queryUser).toHaveBeenCalledWith({ id: 'u1' });
  });

  it('rejects websocket requests without a valid token', async () => {
    mocked.getData.mockImplementation(() => {
      throw new Error('invalid-token');
    });

    const { resolveWebsocketUserId } = await import('../ws-server.js');

    await expect(resolveWebsocketUserId({ url: '/ws?token=bad' } as never)).resolves.toBeNull();
  });
});
