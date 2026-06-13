export type WsConnectionState = 'connecting' | 'connected' | 'reconnecting' | 'disconnected';

export interface WsMessage<T = unknown> {
  id: string;
  event: string;
  ts: string;
  data: T;
}

export interface WsReadyPayload {
  heartbeatMs: number;
  serverTime: string;
}

export type EventHandler<T = unknown> = (payload: T) => void;
