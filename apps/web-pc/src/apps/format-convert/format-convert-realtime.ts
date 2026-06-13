import type { FormatConvertTaskItem } from '@volix/types';
import { websocketEventBus } from '@/services/websocket-event-bus';
import type { WsConnectionState } from '@/services/ws-protocol';

type Handlers = {
  onCreated: (task: FormatConvertTaskItem) => void;
  onUpdated: (task: FormatConvertTaskItem) => void;
  onDeleted: (taskId: number) => void;
  onReconnect: () => void;
};

export const subscribeToFormatConvertTaskEvents = (handlers: Handlers) => {
  let hasConnectedOnce = false;

  const unsubscribers = [
    websocketEventBus.subscribe<FormatConvertTaskItem>('format-convert.task.created', handlers.onCreated),
    websocketEventBus.subscribe<FormatConvertTaskItem>('format-convert.task.updated', handlers.onUpdated),
    websocketEventBus.subscribe<{ taskId: number }>('format-convert.task.deleted', payload =>
      handlers.onDeleted(payload.taskId)
    ),
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
