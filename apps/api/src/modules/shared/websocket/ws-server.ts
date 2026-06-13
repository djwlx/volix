import { randomUUID } from 'node:crypto';
import type { Server } from 'node:http';
import { WebSocketServer, type WebSocket } from 'ws';
import type { WsMessage, WebsocketReadyPayload } from './ws-protocol';
import { WS_CONNECTION_READY_EVENT, WS_HEARTBEAT_INTERVAL_MS } from './ws-protocol';
import JWT from '../../../utils/jwt';
import { log } from '../../../utils/logger';
import { queryUser } from '../../user';

type RegistrySocket = Pick<WebSocket, 'send' | 'close' | 'on' | 'ping' | 'terminate'> & {
  isAlive?: boolean;
};

type ConnectionRegistry = ReturnType<typeof createWebsocketConnectionRegistry>;

const createWsMessage = <T>(event: string, data: T): WsMessage<T> => ({
  id: randomUUID(),
  event,
  ts: new Date().toISOString(),
  data,
});

export const createWebsocketConnectionRegistry = () => {
  const userSockets = new Map<string, Set<RegistrySocket>>();

  const add = (userId: string, socket: RegistrySocket) => {
    const current = userSockets.get(userId) || new Set<RegistrySocket>();
    current.add(socket);
    userSockets.set(userId, current);
  };

  const remove = (userId: string, socket: RegistrySocket) => {
    const current = userSockets.get(userId);
    if (!current) {
      return;
    }

    current.delete(socket);
    if (current.size === 0) {
      userSockets.delete(userId);
    }
  };

  const list = (userId: string) => Array.from(userSockets.get(userId) || []);

  return {
    add,
    remove,
    list,
  };
};

const registry = createWebsocketConnectionRegistry();

export const emitWsMessage = <T>(targetRegistry: ConnectionRegistry, userId: string, event: string, data: T) => {
  const payload = JSON.stringify(createWsMessage(event, data));

  targetRegistry.list(userId).forEach(socket => {
    socket.send(payload);
  });
};

const bindSocketLifecycle = (userId: string, socket: RegistrySocket) => {
  socket.isAlive = true;
  socket.on('pong', () => {
    socket.isAlive = true;
  });
  socket.on('close', () => {
    registry.remove(userId, socket);
    log.info('[websocket] 连接关闭', { userId });
  });
  socket.on('error', error => {
    registry.remove(userId, socket);
    log.warn('[websocket] 连接异常', { userId, error });
  });
};

const sendReadyMessage = (socket: RegistrySocket) => {
  const payload: WebsocketReadyPayload = {
    heartbeatMs: WS_HEARTBEAT_INTERVAL_MS,
    serverTime: new Date().toISOString(),
  };
  socket.send(JSON.stringify(createWsMessage(WS_CONNECTION_READY_EVENT, payload)));
};

let heartbeatTimer: NodeJS.Timeout | null = null;

const createHeartbeatLoop = (wss: WebSocketServer) => {
  if (heartbeatTimer) {
    return;
  }

  heartbeatTimer = setInterval(() => {
    wss.clients.forEach(client => {
      const socket = client as RegistrySocket;
      if (socket.isAlive === false) {
        socket.terminate();
        return;
      }

      socket.isAlive = false;
      socket.ping();
    });
  }, WS_HEARTBEAT_INTERVAL_MS);
};

export const resolveWebsocketUserId = async (request: { url?: string | null }) => {
  const url = new URL(request.url || '', 'http://localhost');
  const token = String(url.searchParams.get('token') || '').trim();
  if (!token) {
    return null;
  }

  try {
    const data = JWT.getData(token);
    const userId = data?.id;
    if (userId === undefined || userId === null || String(userId).trim() === '') {
      return null;
    }

    const user = await queryUser({ id: userId });
    if (!user?.dataValues?.id && user?.dataValues?.id !== 0) {
      return null;
    }

    return String(user.dataValues.id);
  } catch {
    return null;
  }
};

export const attachWebsocketServer = (server: Server) => {
  const wss = new WebSocketServer({
    noServer: true,
  });

  createHeartbeatLoop(wss);

  server.on('upgrade', async (request, socket, head) => {
    const url = new URL(request.url || '', 'http://localhost');
    if (url.pathname !== '/ws') {
      socket.destroy();
      return;
    }

    const userId = await resolveWebsocketUserId(request);
    if (!userId) {
      log.warn('[websocket] 升级被拒绝：鉴权失败');
      socket.destroy();
      return;
    }

    wss.handleUpgrade(request, socket, head, ws => {
      const registrySocket = ws as RegistrySocket;
      registry.add(userId, registrySocket);
      bindSocketLifecycle(userId, registrySocket);
      sendReadyMessage(registrySocket);
      log.info('[websocket] 连接建立', { userId });
    });
  });

  return wss;
};

export const emitWebsocketEventToUser = <T>(userId: string, event: string, data: T) => {
  emitWsMessage(registry, userId, event, data);
};
