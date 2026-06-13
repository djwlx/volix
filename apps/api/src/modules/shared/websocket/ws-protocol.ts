export interface WsMessage<T = unknown> {
  id: string;
  event: string;
  ts: string;
  data: T;
}

export interface WebsocketReadyPayload {
  heartbeatMs: number;
  serverTime: string;
}

export const WS_CONNECTION_READY_EVENT = 'ws.connection.ready';
export const WS_HEARTBEAT_INTERVAL_MS = 25_000;
