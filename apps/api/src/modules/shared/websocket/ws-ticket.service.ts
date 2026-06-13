import { randomUUID } from 'node:crypto';
import type { WebsocketTicket } from './ws-protocol';

const WS_TICKET_TTL_MS = 60_000;

type StoredTicket = {
  userId: string;
  expiresAt: number;
};

const ticketStore = new Map<string, StoredTicket>();

const toTicket = (value: string, expiresAt: number): WebsocketTicket => ({
  value,
  expiresAt: new Date(expiresAt).toISOString(),
});

export const issueWebsocketTicket = (userId: string): WebsocketTicket => {
  const value = randomUUID();
  const expiresAt = Date.now() + WS_TICKET_TTL_MS;

  ticketStore.set(value, {
    userId,
    expiresAt,
  });

  return toTicket(value, expiresAt);
};

export const clearExpiredWebsocketTickets = () => {
  const now = Date.now();

  for (const [ticket, current] of ticketStore.entries()) {
    if (current.expiresAt <= now) {
      ticketStore.delete(ticket);
    }
  }
};

export const consumeWebsocketTicket = (value: string) => {
  clearExpiredWebsocketTickets();

  const current = ticketStore.get(value);
  if (!current) {
    return null;
  }

  ticketStore.delete(value);
  return {
    userId: current.userId,
  };
};

export const __resetWebsocketTicketsForTest = () => {
  ticketStore.clear();
};
