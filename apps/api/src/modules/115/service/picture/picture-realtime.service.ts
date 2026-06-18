import { emitWebsocketEventToUserDebounced } from '../../../shared/websocket/ws-server';

const PIC_115_INFO_CHANGED_EVENT = 'pic115.info.changed';
const PIC_115_INFO_CHANGED_DEBOUNCE_MS = 400;

type Pic115InfoChangedPayload = {
  source: 'action' | 'queue';
};

export const emitPic115InfoChanged = (userId: string, payload: Pic115InfoChangedPayload) => {
  const normalizedUserId = String(userId || '').trim();
  if (!normalizedUserId || normalizedUserId === 'public') {
    return;
  }

  emitWebsocketEventToUserDebounced(normalizedUserId, PIC_115_INFO_CHANGED_EVENT, payload, {
    delayMs: PIC_115_INFO_CHANGED_DEBOUNCE_MS,
  });
};
