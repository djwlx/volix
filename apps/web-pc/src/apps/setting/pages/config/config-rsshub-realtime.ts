import { websocketEventBus } from '@/services/websocket-event-bus';
import type { WsConnectionState } from '@/services/ws-protocol';

type RssStorageRealtimeHandlers = {
  onChanged: () => void;
  onReconnect: () => void;
};

export const subscribeToRssStorageEvents = (handlers: RssStorageRealtimeHandlers) => {
  let hasConnectedOnce = false;

  const unsubscribers = [
    websocketEventBus.subscribe('rss.storage.changed', handlers.onChanged),
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
