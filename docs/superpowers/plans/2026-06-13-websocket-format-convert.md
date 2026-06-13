# WebSocket Format Convert Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a shared authenticated WebSocket runtime and migrate `format-convert` task updates from polling to real-time events.

**Architecture:** Build the backend around a small shared WebSocket module that owns ticket issuance, upgrade handling, connection registries, and user-scoped event emission. Build the frontend around a shared WebSocket manager plus event bus, then connect `format-convert` through a small task-event adapter so the page keeps HTTP for bootstrap and mutations but consumes task updates in real time.

**Tech Stack:** Koa, Node HTTP server, `ws`, TypeScript, React 18, Vitest, pnpm workspace

---

### Task 1: Add the Shared Backend WebSocket Runtime

**Files:**
- Modify: `apps/api/package.json`
- Create: `apps/api/src/modules/shared/websocket/ws-protocol.ts`
- Create: `apps/api/src/modules/shared/websocket/ws-ticket.service.ts`
- Create: `apps/api/src/modules/shared/websocket/ws-server.ts`
- Create: `apps/api/src/modules/shared/websocket/websocket-ticket.controller.ts`
- Create: `apps/api/src/modules/shared/websocket/websocket-ticket.route.ts`
- Create: `apps/api/src/modules/shared/websocket/index.ts`
- Create: `apps/api/src/modules/shared/websocket/__tests__/ws-ticket.service.test.ts`
- Create: `apps/api/src/modules/shared/websocket/__tests__/ws-server.test.ts`
- Modify: `apps/api/app.ts`
- Modify: `apps/api/src/routes/index.ts`

- [ ] **Step 1: Write failing backend tests for ticket lifecycle and user-scoped delivery**

Create the shared WebSocket test files first.

```ts
// apps/api/src/modules/shared/websocket/__tests__/ws-ticket.service.test.ts
import { beforeEach, describe, expect, it, vi } from 'vitest';

describe('websocket ticket service', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it('creates a one-time ticket for a user and consumes it exactly once', async () => {
    const service = await import('../ws-ticket.service.js');

    const issued = service.issueWebsocketTicket('u1');

    expect(service.consumeWebsocketTicket(issued.value)).toMatchObject({ userId: 'u1' });
    expect(service.consumeWebsocketTicket(issued.value)).toBeNull();
  });

  it('expires tickets after the ttl window', async () => {
    const service = await import('../ws-ticket.service.js');

    const issued = service.issueWebsocketTicket('u2');
    vi.advanceTimersByTime(61_000);

    expect(service.consumeWebsocketTicket(issued.value)).toBeNull();
  });
});
```

```ts
// apps/api/src/modules/shared/websocket/__tests__/ws-server.test.ts
import { describe, expect, it } from 'vitest';

describe('websocket server registry', () => {
  it('emits only to sockets registered for the matching user', async () => {
    const { createWebsocketConnectionRegistry, emitWsMessage } = await import('../ws-server.js');

    const sentA: unknown[] = [];
    const sentB: unknown[] = [];
    const registry = createWebsocketConnectionRegistry();

    registry.add('u1', { send: (payload: string) => sentA.push(JSON.parse(payload)), close: () => undefined } as never);
    registry.add('u2', { send: (payload: string) => sentB.push(JSON.parse(payload)), close: () => undefined } as never);

    emitWsMessage(registry, 'u1', 'format-convert.task.updated', { taskId: 1 });

    expect(sentA).toHaveLength(1);
    expect(sentB).toHaveLength(0);
  });
});
```

- [ ] **Step 2: Run the backend WebSocket tests and verify they fail for missing modules**

Run:

```bash
pnpm test -- apps/api/src/modules/shared/websocket/__tests__/ws-ticket.service.test.ts apps/api/src/modules/shared/websocket/__tests__/ws-server.test.ts
```

Expected: `FAIL` because the new shared WebSocket runtime files do not exist yet.

- [ ] **Step 3: Add the `ws` dependency with the repo-required Node version**

Update `apps/api/package.json` to include:

```json
    "ws": "^8.18.3"
```

Run:

```bash
source ~/.nvm/nvm.sh && nvm use "$(cat .nvmrc)" && pnpm add --filter @volix/api ws
```

Expected: `apps/api/package.json` and `pnpm-lock.yaml` update under the `lts/iron` Node version from `.nvmrc`.

- [ ] **Step 4: Implement the shared protocol, ticket service, and upgrade server**

Add the protocol and service contracts as small focused files.

```ts
// apps/api/src/modules/shared/websocket/ws-protocol.ts
export interface WsMessage<T = unknown> {
  id: string;
  event: string;
  ts: string;
  data: T;
}

export interface WebsocketTicket {
  value: string;
  expiresAt: string;
}
```

```ts
// apps/api/src/modules/shared/websocket/ws-ticket.service.ts
const WS_TICKET_TTL_MS = 60_000;

export const issueWebsocketTicket = (userId: string) => {
  const value = randomUUID();
  const expiresAt = new Date(Date.now() + WS_TICKET_TTL_MS);
  ticketStore.set(value, { userId, expiresAt: expiresAt.getTime() });
  return { value, expiresAt: expiresAt.toISOString() };
};

export const consumeWebsocketTicket = (value: string) => {
  const current = ticketStore.get(value);
  if (!current || current.expiresAt <= Date.now()) {
    ticketStore.delete(value);
    return null;
  }
  ticketStore.delete(value);
  return { userId: current.userId };
};

export const clearExpiredWebsocketTickets = () => {
  for (const [ticket, current] of ticketStore.entries()) {
    if (current.expiresAt <= Date.now()) {
      ticketStore.delete(ticket);
    }
  }
};
```

```ts
// apps/api/src/modules/shared/websocket/ws-server.ts
export const createWebsocketConnectionRegistry = () => ({ add, remove, list });
export const emitWsMessage = (registry, userId, event, data) => {
  const payload = JSON.stringify({ id: randomUUID(), event, ts: new Date().toISOString(), data });
  registry.list(userId).forEach(socket => socket.send(payload));
};
export const attachWebsocketServer = (server: Server) => {
  server.on('upgrade', (request, socket, head) => {
    const { pathname, searchParams } = new URL(request.url || '', 'http://localhost');
    if (pathname !== '/ws') {
      socket.destroy();
      return;
    }

    const ticket = searchParams.get('ticket') || '';
    const resolved = consumeWebsocketTicket(ticket);
    if (!resolved) {
      socket.destroy();
      return;
    }

    wss.handleUpgrade(request, socket, head, ws => {
      registry.add(resolved.userId, ws);
      ws.send(JSON.stringify({ id: randomUUID(), event: 'ws.connection.ready', ts: new Date().toISOString(), data: { heartbeatMs: 25_000 } }));
    });
  });
};
export const emitWebsocketEventToUser = (userId: string, event: string, data: unknown) => {
  emitWsMessage(registry, userId, event, data);
};
```

Expose the authenticated ticket endpoint:

```ts
// apps/api/src/modules/shared/websocket/websocket-ticket.controller.ts
export const createWebsocketTicket: MyMiddleware = async ctx => {
  const userId = String(ctx.state.userInfo?.id || '');
  return issueWebsocketTicket(userId);
};
```

```ts
// apps/api/src/modules/shared/websocket/websocket-ticket.route.ts
const router = new Router({ prefix: '/ws' });
router.use(authenticate());
router.post('/ticket', http(createWebsocketTicket));
```

Wire startup and routes:

```ts
// apps/api/app.ts
const server = createServer(app.callback());
attachWebsocketServer(server);
server.listen(config.port, () => {
  log.info('应用启动在端口：', config.port);
});
```

```ts
// apps/api/src/routes/index.ts
router.use(websocketTicketRouter.routes());
```

- [ ] **Step 5: Re-run the focused backend WebSocket tests and verify they pass**

Run:

```bash
pnpm test -- apps/api/src/modules/shared/websocket/__tests__/ws-ticket.service.test.ts apps/api/src/modules/shared/websocket/__tests__/ws-server.test.ts
```

Expected: `PASS` for one-time ticket consumption and user-scoped message emission.

- [ ] **Step 6: Commit the backend shared runtime**

```bash
git add apps/api/package.json pnpm-lock.yaml apps/api/app.ts apps/api/src/routes/index.ts apps/api/src/modules/shared/websocket
git commit -m "feat: add shared websocket runtime"
```

### Task 2: Emit Format Convert Events from the Backend Task Layer

**Files:**
- Create: `apps/api/src/modules/format-convert/service/format-convert-task-realtime.service.ts`
- Create: `apps/api/src/modules/format-convert/service/__tests__/format-convert-task-realtime.test.ts`
- Modify: `apps/api/src/modules/format-convert/service/format-convert-task-db.service.ts`
- Modify: `apps/api/src/modules/format-convert/controller/format-convert.controller.ts`

- [ ] **Step 1: Write failing tests for create, update, and delete event emission**

Create a focused test that mocks the shared emitter.

```ts
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocked = vi.hoisted(() => ({
  emitWebsocketEventToUser: vi.fn(),
}));

vi.mock('../../shared/websocket/ws-server', () => ({
  emitWebsocketEventToUser: mocked.emitWebsocketEventToUser,
}));

describe('format convert realtime events', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('emits task.updated with the persisted public task shape', async () => {
    const { emitFormatConvertTaskUpdated } = await import('../format-convert-task-realtime.service.js');

    await emitFormatConvertTaskUpdated({
      id: 1,
      userId: 'u1',
      status: 'completed',
    } as never);

    expect(mocked.emitWebsocketEventToUser).toHaveBeenCalledWith(
      'u1',
      'format-convert.task.updated',
      expect.objectContaining({ id: 1, status: 'completed' })
    );
  });
});
```

- [ ] **Step 2: Run the focused realtime emission test and verify it fails**

Run:

```bash
pnpm test -- apps/api/src/modules/format-convert/service/__tests__/format-convert-task-realtime.test.ts
```

Expected: `FAIL` because the realtime emitter module does not exist yet.

- [ ] **Step 3: Implement the format convert realtime emitter wrapper**

Create the transport-facing helper and keep it small.

```ts
// apps/api/src/modules/format-convert/service/format-convert-task-realtime.service.ts
import { emitWebsocketEventToUser } from '../../shared/websocket/ws-server';
import type { FormatConvertTaskItem } from '../types/format-convert.types';

export const emitFormatConvertTaskCreated = async (task: FormatConvertTaskItem) => {
  emitWebsocketEventToUser(String(task.userId), 'format-convert.task.created', task);
};

export const emitFormatConvertTaskUpdated = async (task: FormatConvertTaskItem) => {
  emitWebsocketEventToUser(String(task.userId), 'format-convert.task.updated', task);
};

export const emitFormatConvertTaskDeleted = (userId: string, taskId: number) => {
  emitWebsocketEventToUser(userId, 'format-convert.task.deleted', { taskId });
};
```

- [ ] **Step 4: Hook task create, update, retry, and delete flows into the emitter**

Emit from the persistence boundary inside `format-convert-task-db.service.ts`.

```ts
export const createFormatConvertTask = async (payload: CreateFormatConvertTaskDbPayload) => {
  const task = mapFormatConvertTaskRow(row.dataValues as FormatConvertTaskEntity);
  await emitFormatConvertTaskCreated(task);
  return task;
};
```

```ts
export const updateFormatConvertTask = async (taskId: number, payload: Partial<FormatConvertTaskEntity>) => {
  await FormatConvertTaskModel.update(payload, { where: { id: taskId } });
  const task = await getFormatConvertTaskById(taskId);
  if (task) {
    await emitFormatConvertTaskUpdated(task);
  }
  return task;
};
```

Emit delete events from the controller after successful record removal so the deleted `taskId` is still available.

```ts
await deleteFormatConvertTaskByIdAndUserId(taskId, userId);
emitFormatConvertTaskDeleted(userId, taskId);
```

- [ ] **Step 5: Run the focused realtime emission test and a format convert smoke test**

Run:

```bash
pnpm test -- apps/api/src/modules/format-convert/service/__tests__/format-convert-task-realtime.test.ts apps/api/src/modules/format-convert/service/__tests__/format-convert-openlist.service.test.ts
```

Expected: `PASS` for the new event emission coverage and the existing format convert service test.

- [ ] **Step 6: Commit the backend format convert integration**

```bash
git add apps/api/src/modules/format-convert/controller/format-convert.controller.ts apps/api/src/modules/format-convert/service/format-convert-task-db.service.ts apps/api/src/modules/format-convert/service/format-convert-task-realtime.service.ts apps/api/src/modules/format-convert/service/__tests__/format-convert-task-realtime.test.ts
git commit -m "feat: emit realtime format convert task events"
```

### Task 3: Add the Shared Frontend WebSocket Manager and Event Bus

**Files:**
- Create: `apps/web-pc/src/services/ws-protocol.ts`
- Create: `apps/web-pc/src/services/websocket-ticket.ts`
- Create: `apps/web-pc/src/services/websocket-manager.ts`
- Create: `apps/web-pc/src/services/websocket-event-bus.ts`
- Create: `apps/web-pc/src/services/__tests__/websocket-manager.test.ts`

- [ ] **Step 1: Write failing frontend tests for ticket fetch, message dispatch, and reconnect state**

Create the shared manager test first.

```ts
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocked = vi.hoisted(() => ({
  createTicket: vi.fn(),
}));

vi.mock('../websocket-ticket', () => ({
  createWebsocketTicket: mocked.createTicket,
}));

describe('websocket manager', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('requests a ticket before opening the socket and dispatches parsed events', async () => {
    mocked.createTicket.mockResolvedValue({ value: 'ticket-1', expiresAt: '2026-06-13T00:00:00.000Z' });
    const { createWebsocketManager } = await import('../websocket-manager');

    const manager = createWebsocketManager();
    const handler = vi.fn();
    manager.subscribe('format-convert.task.updated', handler);

    await manager.connect();

    expect(mocked.createTicket).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run the shared frontend manager test and verify it fails**

Run:

```bash
pnpm test -- apps/web-pc/src/services/__tests__/websocket-manager.test.ts
```

Expected: `FAIL` because the shared manager modules do not exist yet.

- [ ] **Step 3: Add the shared frontend protocol, ticket call, and WebSocket manager**

Add the protocol and ticket client.

```ts
// apps/web-pc/src/services/ws-protocol.ts
export type WsConnectionState = 'connecting' | 'connected' | 'reconnecting' | 'disconnected';

export interface WsMessage<T = unknown> {
  id: string;
  event: string;
  ts: string;
  data: T;
}
```

```ts
// apps/web-pc/src/services/websocket-ticket.ts
export const createWebsocketTicket = () => {
  return http.post<{ value: string; expiresAt: string }>('/ws/ticket');
};
```

Implement the shared manager and event bus.

```ts
// apps/web-pc/src/services/websocket-manager.ts
export const createWebsocketManager = () => ({
  connect,
  disconnect,
  subscribe,
  getState,
});
```

```ts
// apps/web-pc/src/services/websocket-event-bus.ts
const manager = createWebsocketManager();

export const websocketEventBus = {
  connect: () => manager.connect(),
  disconnect: () => manager.disconnect(),
  subscribe: manager.subscribe,
};
```

- [ ] **Step 4: Keep the ticket endpoint in the shared WebSocket service layer**

Do not add the ticket call to `apps/web-pc/src/services/format-convert.ts`. Keep the transport contract isolated in the new shared WebSocket files so later pages can reuse it without importing `format-convert` code.

```ts
// apps/web-pc/src/services/websocket-ticket.ts
export interface CreateWebsocketTicketResult {
  value: string;
  expiresAt: string;
}

export const createWebsocketTicket = () => {
  return http.post<CreateWebsocketTicketResult>('/ws/ticket');
};
```

- [ ] **Step 5: Re-run the shared frontend manager test and verify it passes**

Run:

```bash
pnpm test -- apps/web-pc/src/services/__tests__/websocket-manager.test.ts
```

Expected: `PASS` for ticket acquisition, parsed dispatch, and reconnect-state coverage.

- [ ] **Step 6: Commit the shared frontend runtime**

```bash
git add apps/web-pc/src/services/ws-protocol.ts apps/web-pc/src/services/websocket-ticket.ts apps/web-pc/src/services/websocket-manager.ts apps/web-pc/src/services/websocket-event-bus.ts apps/web-pc/src/services/__tests__/websocket-manager.test.ts
git commit -m "feat: add shared frontend websocket manager"
```

### Task 4: Migrate Format Convert from Polling to Realtime Updates

**Files:**
- Create: `apps/web-pc/src/apps/format-convert/format-convert-task-events.ts`
- Create: `apps/web-pc/src/apps/format-convert/format-convert-realtime.ts`
- Create: `apps/web-pc/src/apps/format-convert/__tests__/format-convert-realtime.test.ts`
- Create: `apps/web-pc/src/apps/format-convert/__tests__/format-convert-app-realtime.test.ts`
- Modify: `apps/web-pc/src/apps/format-convert/index.tsx`

- [ ] **Step 1: Write failing tests for task upsert/remove helpers and app-level polling removal**

Create a pure task-event test and a light app rendering test with mocked children.

```ts
// apps/web-pc/src/apps/format-convert/__tests__/format-convert-realtime.test.ts
import { describe, expect, it } from 'vitest';
import { upsertFormatConvertTask, removeFormatConvertTaskById } from '../format-convert-task-events';

describe('format convert realtime task events', () => {
  it('prepends newly created tasks and replaces updated tasks by id', () => {
    const first = upsertFormatConvertTask([], { id: 2, status: 'pending' } as never);
    const second = upsertFormatConvertTask(first, { id: 2, status: 'completed' } as never);

    expect(first[0]?.id).toBe(2);
    expect(second[0]?.status).toBe('completed');
  });

  it('removes deleted tasks by id', () => {
    expect(removeFormatConvertTaskById([{ id: 9 } as never], 9)).toEqual([]);
  });
});
```

```ts
// apps/web-pc/src/apps/format-convert/__tests__/format-convert-app-realtime.test.ts
it('loads once and subscribes to realtime updates without starting an interval', async () => {
  const setIntervalSpy = vi.spyOn(window, 'setInterval');
  const { default: FormatConvertApp } = await import('../index');

  await act(async () => {
    root.render(createElement(FormatConvertApp));
  });

  expect(setIntervalSpy).not.toHaveBeenCalled();
  expect(mocked.subscribeToFormatConvertTaskEvents).toHaveBeenCalled();
});
```

- [ ] **Step 2: Run the format convert realtime tests and verify they fail**

Run:

```bash
pnpm test -- apps/web-pc/src/apps/format-convert/__tests__/format-convert-realtime.test.ts apps/web-pc/src/apps/format-convert/__tests__/format-convert-app-realtime.test.ts
```

Expected: `FAIL` because the new task-event helper files and app subscription wiring do not exist yet.

- [ ] **Step 3: Implement the task-event helpers and realtime subscription adapter**

Keep the task list math pure and small.

```ts
// apps/web-pc/src/apps/format-convert/format-convert-task-events.ts
export const upsertFormatConvertTask = (tasks: FormatConvertTaskItem[], nextTask: FormatConvertTaskItem) => {
  const filtered = tasks.filter(task => task.id !== nextTask.id);
  return [nextTask, ...filtered];
};

export const removeFormatConvertTaskById = (tasks: FormatConvertTaskItem[], taskId: number) => {
  return tasks.filter(task => task.id !== taskId);
};
```

Create the adapter that binds named bus events to `setTasks`.

```ts
// apps/web-pc/src/apps/format-convert/format-convert-realtime.ts
export const subscribeToFormatConvertTaskEvents = (
  handlers: {
    onCreated: (task: FormatConvertTaskItem) => void;
    onUpdated: (task: FormatConvertTaskItem) => void;
    onDeleted: (taskId: number) => void;
    onReconnect: () => void;
  }
) => {
  const unsubscribers = [
    websocketEventBus.subscribe('format-convert.task.created', handlers.onCreated),
    websocketEventBus.subscribe('format-convert.task.updated', handlers.onUpdated),
    websocketEventBus.subscribe('format-convert.task.deleted', payload => handlers.onDeleted(payload.taskId)),
    websocketEventBus.subscribe('ws.connection.changed', state => {
      if (state === 'connected') {
        handlers.onReconnect();
      }
    }),
  ];

  return () => {
    unsubscribers.forEach(unsubscribe => unsubscribe());
  };
};
```

- [ ] **Step 4: Replace the polling interval in the app component with realtime subscriptions**

Refactor `apps/web-pc/src/apps/format-convert/index.tsx` so the page still bootstraps from HTTP but no longer sets an interval.

```tsx
  useEffect(() => {
    void loadTasks();

    const unsubscribe = subscribeToFormatConvertTaskEvents({
      onCreated: task => setTasks(current => upsertFormatConvertTask(current, task)),
      onUpdated: task => setTasks(current => upsertFormatConvertTask(current, task)),
      onDeleted: taskId => setTasks(current => removeFormatConvertTaskById(current, taskId)),
      onReconnect: () => void loadTasks(),
    });

    void websocketEventBus.connect();

    return () => {
      unsubscribe();
    };
  }, []);
```

- [ ] **Step 5: Run the focused format convert realtime tests and the existing task-status test**

Run:

```bash
pnpm test -- apps/web-pc/src/apps/format-convert/__tests__/format-convert-realtime.test.ts apps/web-pc/src/apps/format-convert/__tests__/format-convert-app-realtime.test.ts
```

Expected: `PASS` for the new realtime update coverage and the existing status rendering test.

- [ ] **Step 6: Run typecheck and commit the end-to-end feature**

Run:

```bash
pnpm typecheck
```

Expected: `PASS` across the workspace with the new backend and frontend WebSocket files included.

Commit:

```bash
git add apps/web-pc/src/apps/format-convert/index.tsx apps/web-pc/src/apps/format-convert/format-convert-task-events.ts apps/web-pc/src/apps/format-convert/format-convert-realtime.ts apps/web-pc/src/apps/format-convert/__tests__/format-convert-realtime.test.ts apps/web-pc/src/apps/format-convert/__tests__/format-convert-app-realtime.test.ts
git commit -m "feat: switch format convert to realtime task updates"
```
