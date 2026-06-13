import { createWebsocketTicket } from './websocket-ticket';
import type { CreateWebsocketTicketResult, EventHandler, WsConnectionState, WsMessage } from './ws-protocol';

type SocketLike = Pick<WebSocket, 'close' | 'onclose' | 'onerror' | 'onmessage' | 'onopen'>;
type LocationLike = Pick<Location, 'host' | 'protocol'>;

type CreateWebsocketManagerOptions = {
  createSocket?: (url: string) => SocketLike;
  createTicket?: () => Promise<CreateWebsocketTicketResult>;
  getLocation?: () => LocationLike;
  reconnectDelaysMs?: number[];
};

const DEFAULT_RECONNECT_DELAYS_MS = [1_000, 2_000, 5_000, 10_000, 20_000];

const buildWebsocketUrl = (location: LocationLike, ticket: string) => {
  const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${protocol}//${location.host}/ws?ticket=${encodeURIComponent(ticket)}`;
};

export const createWebsocketManager = (options?: CreateWebsocketManagerOptions) => {
  const createSocket = options?.createSocket || (url => new WebSocket(url));
  const getLocation = options?.getLocation || (() => window.location);
  const requestTicket = options?.createTicket || createWebsocketTicket;
  const reconnectDelaysMs = options?.reconnectDelaysMs || DEFAULT_RECONNECT_DELAYS_MS;
  const handlers = new Map<string, Set<EventHandler>>();
  let socket: SocketLike | null = null;
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  let reconnectAttempt = 0;
  let disconnecting = false;
  let state: WsConnectionState = 'disconnected';

  const emit = (event: string, payload: unknown) => {
    handlers.get(event)?.forEach(handler => {
      handler(payload);
    });
  };

  const setState = (nextState: WsConnectionState) => {
    state = nextState;
    emit('ws.connection.changed', nextState);
  };

  const clearReconnectTimer = () => {
    if (!reconnectTimer) {
      return;
    }

    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  };

  const scheduleReconnect = () => {
    clearReconnectTimer();
    const delay = reconnectDelaysMs[Math.min(reconnectAttempt, reconnectDelaysMs.length - 1)] || 20_000;
    reconnectAttempt += 1;
    reconnectTimer = setTimeout(() => {
      void connect(true);
    }, delay);
  };

  const handleClose = () => {
    socket = null;
    if (disconnecting) {
      setState('disconnected');
      return;
    }

    setState('reconnecting');
    scheduleReconnect();
  };

  const connect = async (isReconnect = false) => {
    if (socket) {
      return;
    }

    disconnecting = false;
    setState(isReconnect ? 'reconnecting' : 'connecting');

    const ticket = await requestTicket();
    const url = buildWebsocketUrl(getLocation(), ticket.value);
    const nextSocket = createSocket(url);
    socket = nextSocket;

    nextSocket.onmessage = event => {
      try {
        const message = JSON.parse(String(event.data || '')) as WsMessage;
        if (message.event === 'ws.connection.ready') {
          reconnectAttempt = 0;
          setState('connected');
        }
        emit(message.event, message.data);
      } catch {
        return;
      }
    };

    nextSocket.onclose = () => {
      handleClose();
    };

    nextSocket.onerror = () => {
      return;
    };

    nextSocket.onopen = () => {
      return;
    };
  };

  const disconnect = () => {
    disconnecting = true;
    clearReconnectTimer();
    socket?.close();
    socket = null;
    setState('disconnected');
  };

  const subscribe = <T>(event: string, handler: EventHandler<T>) => {
    const current = handlers.get(event) || new Set<EventHandler>();
    current.add(handler as EventHandler);
    handlers.set(event, current);

    return () => {
      current.delete(handler as EventHandler);
      if (current.size === 0) {
        handlers.delete(event);
      }
    };
  };

  return {
    connect,
    disconnect,
    getState: () => state,
    subscribe,
  };
};
