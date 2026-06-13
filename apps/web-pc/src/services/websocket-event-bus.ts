import { createWebsocketManager } from './websocket-manager';

const manager = createWebsocketManager();

export const websocketEventBus = {
  connect: () => manager.connect(),
  disconnect: () => manager.disconnect(),
  getState: () => manager.getState(),
  subscribe: manager.subscribe,
};
