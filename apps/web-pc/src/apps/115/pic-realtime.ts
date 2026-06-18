import { websocketEventBus } from '@/services/websocket-event-bus';
import type { WsConnectionState } from '@/services/ws-protocol';

type PicRealtimeHandlers = {
  onChanged: () => void;
  onReconnect: () => void;
};

export const subscribeToPic115InfoEvents = (handlers: PicRealtimeHandlers) => {
  let hasConnectedOnce = false;

  const unsubscribers = [
    websocketEventBus.subscribe('pic115.info.changed', handlers.onChanged),
    websocketEventBus.subscribe<WsConnectionState>('ws.connection.changed', state => {
      if (state !== 'connected') {
        return;
      }

      if (hasConnectedOnce) {
        handlers.onReconnect();
        return;
      }

      hasConnectedOnce = true;
    }),
  ];

  return () => {
    unsubscribers.forEach(unsubscribe => unsubscribe());
  };
};
