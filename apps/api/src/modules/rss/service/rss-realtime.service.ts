import { emitWebsocketEventToUserDebounced } from '../../shared/websocket/ws-server';

const RSS_STORAGE_CHANGED_EVENT = 'rss.storage.changed';
const RSS_STORAGE_CHANGED_DEBOUNCE_MS = 500;

type RssStorageChangedPayload = {
  source: 'action' | 'queue';
};

export const emitRssStorageChanged = (userId: string, payload: RssStorageChangedPayload) => {
  const normalizedUserId = String(userId || '').trim();
  if (!normalizedUserId) {
    return;
  }

  emitWebsocketEventToUserDebounced(normalizedUserId, RSS_STORAGE_CHANGED_EVENT, payload, {
    delayMs: RSS_STORAGE_CHANGED_DEBOUNCE_MS,
  });
};
