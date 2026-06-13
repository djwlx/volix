# WebSocket Format Convert Design

## Goal

Introduce a shared WebSocket transport for real-time app events and use `format-convert` as the first consumer so the task list no longer depends on periodic polling.

## Scope

- Add a backend WebSocket server on the same port as the existing HTTP API.
- Authenticate WebSocket connections through a short-lived HTTP-issued ticket.
- Add shared frontend WebSocket connection management with heartbeat and reconnect support.
- Add a frontend event bus abstraction so pages subscribe to named events instead of raw socket frames.
- Replace the `format-convert` page's 4-second task polling with event-driven task updates.

## Non-Goals

- No migration of every existing polling page in this change.
- No requirement to expose exact ffmpeg percentage progress in this first version.
- No cross-tab shared socket coordination in this first version.
- No replacement of existing HTTP APIs for initial page load, mutations, or file download.

## Existing Context

- The backend runs on Koa and currently starts through `app.listen(config.port)`.
- Frontend HTTP requests are centralized through `apps/web-pc/src/utils/http.ts` and authenticated with the existing token header.
- `format-convert` tasks already have a clear lifecycle and are surfaced through `getFormatConvertTasks()`.
- The `format-convert` page currently loads once, then refreshes tasks every 4 seconds in `apps/web-pc/src/apps/format-convert/index.tsx`.
- Task state changes already flow through the format convert runner and task DB update helpers, which makes them good event emission points.

## Proposed Design

### Transport

- Keep HTTP and WebSocket on the same port.
- Replace direct `app.listen(...)` startup with an explicit Node HTTP server created from `app.callback()`.
- Mount a WebSocket upgrade path at `/ws`.
- Keep the existing `/api/...` routes unchanged.

### Authentication

- Add a new authenticated HTTP endpoint that returns a short-lived one-time WebSocket ticket.
- The frontend obtains a fresh ticket immediately before each connection attempt.
- The frontend connects with `ws://host/ws?ticket=...` or `wss://host/ws?ticket=...` depending on page protocol.
- The backend validates the ticket, binds the socket to the resolved `userId`, then invalidates the ticket so it cannot be reused.

### Connection Lifecycle

- The backend maintains a connection registry keyed by `userId`.
- The backend sends protocol-level heartbeat frames or explicit ping messages on a fixed interval.
- The frontend responds automatically and updates local connection state.
- The frontend retries with exponential backoff and reacquires a new ticket on every reconnect attempt.
- The frontend exposes connection state to the app as `connecting`, `connected`, `reconnecting`, or `disconnected`.

### Event Envelope

- Use a shared event message shape:

```ts
type WsMessage<T = unknown> = {
  id: string;
  event: string;
  ts: string;
  data: T;
};
```

- `id` supports deduping and debugging.
- `event` is the routing key used by the frontend event bus.
- `ts` is server-created ISO time.
- `data` holds the event payload.

### Shared Frontend Runtime

- Add a shared frontend WebSocket manager responsible for:
  - ticket acquisition
  - creating the browser `WebSocket`
  - heartbeat handling
  - reconnect scheduling
  - message parsing
  - subscription registration
- Add a thin event bus wrapper on top of that manager.
- Pages subscribe by event name and receive typed payloads without depending on socket internals.

### Format Convert Integration

- Keep the initial HTTP `loadTasks()` call for first render.
- Remove the repeating 4-second interval refresh.
- Update the task list incrementally from WebSocket events:
  - create inserts a task if missing
  - update replaces the matching task
  - delete removes the matching task id
- On reconnect success, trigger a single HTTP task reload to heal any events missed during disconnect.

## Event Model

### Shared Connection Events

- `ws.connection.ready`
  - server-sent after successful authentication
  - includes heartbeat timing and server time
- `ws.connection.changed`
  - frontend-local event
  - payload contains the current connection state

### Format Convert Events

- `format-convert.task.created`
  - payload: one public `FormatConvertTaskItem`
- `format-convert.task.updated`
  - payload: one public `FormatConvertTaskItem`
- `format-convert.task.deleted`
  - payload: `{ taskId: number }`
- `format-convert.tasks.snapshot`
  - full list payload
  - reserved in the protocol now, but not required for the first `format-convert` integration

### Progress Semantics

- This version uses task lifecycle states as the real-time progress signal.
- The frontend maps `pending`, `downloading`, `converting`, `uploading`, `completed`, and `*_failed` to UI updates.
- Exact percentage progress remains out of scope for this change and would fit as a new additive event.

## Backend Responsibilities

### Shared WebSocket Module

- Own server upgrade handling and WebSocket session lifecycle.
- Store ticket metadata and validate one-time use.
- Track active connections by `userId`.
- Expose helpers like `emitToUser(userId, event, data)`.
- Clean up dead sockets and expired tickets.

### Ticket Endpoint

- Reuse existing token auth middleware.
- Return a ticket value plus expiry metadata.
- Keep ticket TTL short, such as 60 seconds.

### Format Convert Event Emission

- Emit `task.created` when a task is created through either local or cloud entry points.
- Emit `task.updated` whenever persisted task state changes in a way visible to the user.
- Emit `task.deleted` after a task record is removed.
- Prefer centralizing update emission close to task persistence so future callers do not need to remember to emit manually.

## Frontend Responsibilities

### Shared WebSocket Client

- Live in a shared utility or service area, not inside `format-convert`.
- Use the existing auth and locale helpers where relevant.
- Avoid hardcoded user-visible text.
- Provide subscribe and unsubscribe helpers with small focused files.

### Format Convert Page

- Subscribe on mount and unsubscribe on unmount.
- Keep HTTP for mutations such as create, retry, delete, and download.
- Let mutation success update the UI naturally through socket events.
- Optionally keep a single direct `loadTasks()` call after mutation success only when the event contract would otherwise race with current UI assumptions.

## File Structure Direction

### Backend

- Add a focused shared WebSocket area under `apps/api/src/modules/shared` or a sibling shared runtime folder.
- Add a ticket issuing route and controller in a small isolated module.
- Keep connection registry, ticket store, and emit helpers in separate small files to respect file-size limits.
- Touch `format-convert` only where task creation, update, and deletion need event publication.

### Frontend

- Add shared WebSocket files under `apps/web-pc/src/services` or `apps/web-pc/src/utils` depending on the current boundary that best matches existing transport code.
- Keep manager, event bus, protocol types, and `format-convert` subscriptions in separate small files.
- Update `apps/web-pc/src/apps/format-convert/index.tsx` to remove polling and wire event subscriptions.

## Error Handling

- Invalid, missing, expired, or already-used tickets reject the connection.
- Ticket fetch failure leaves the page functional with HTTP-driven initial state and a disconnected indicator event.
- Socket parse errors drop the bad message and keep the connection alive.
- Server restarts rely on reconnect plus the post-reconnect HTTP sync.
- Logout or unauthorized flows close the socket and clear subscriptions.

## Testing

### Backend

- Add tests for ticket creation, expiry, and one-time consumption.
- Add tests for user-scoped event delivery so one user's task events never leak to another user.
- Add tests for format convert task update emission at the persistence boundary chosen by implementation.

### Frontend

- Add tests for reconnect scheduling and message dispatch in the shared client.
- Add tests for `format-convert` task list updates so create, update, and delete events mutate local state correctly.
- Add a test proving the old polling interval is removed from the page logic.

## Risks And Mitigations

- Socket lifecycle complexity could sprawl across unrelated files.
  - Mitigation: isolate transport, ticketing, and event emission behind small shared modules.
- Event loss during reconnect could leave stale UI state.
  - Mitigation: run a one-shot HTTP resync after reconnect succeeds.
- Browser limitations around custom headers could tempt use of the long-lived auth token in the URL.
  - Mitigation: use short-lived one-time tickets only.
- Future event consumers may need richer contracts.
  - Mitigation: standardize the event envelope now and treat new payloads as additive events.

## Success Criteria

- The backend accepts authenticated WebSocket connections on the same port as HTTP.
- The frontend keeps a stable connection with heartbeat and automatic reconnect.
- `format-convert` task status changes appear without the 4-second polling loop.
- Task create, update, and delete actions stay scoped to the current authenticated user.
- The shared WebSocket runtime is reusable by additional pages without redesigning the protocol.
