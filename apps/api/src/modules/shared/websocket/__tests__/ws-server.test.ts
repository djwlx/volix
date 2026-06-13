import { describe, expect, it } from 'vitest';

describe('websocket server registry', () => {
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
});
