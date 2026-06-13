import { beforeEach, describe, expect, it, vi } from 'vitest';

describe('websocket ticket service', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-13T00:00:00.000Z'));
  });

  it('creates a one-time ticket for a user and consumes it exactly once', async () => {
    const service = await import('../ws-ticket.service.js');

    const issued = service.issueWebsocketTicket('u1');

    expect(issued.value).toBeTruthy();
    expect(service.consumeWebsocketTicket(issued.value)).toMatchObject({ userId: 'u1' });
    expect(service.consumeWebsocketTicket(issued.value)).toBeNull();
  });

  it('expires tickets after the ttl window', async () => {
    const service = await import('../ws-ticket.service.js');

    const issued = service.issueWebsocketTicket('u2');
    vi.advanceTimersByTime(61_000);

    expect(service.consumeWebsocketTicket(issued.value)).toBeNull();
  });
});
