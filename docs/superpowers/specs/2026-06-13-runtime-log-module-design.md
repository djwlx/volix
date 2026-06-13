# Runtime Log Module Design

## Goal

Make backend logs observable from the frontend by adding an admin-only "运行日志" page that reads and parses the existing log4js log files, with log-type switching, level filtering, colorized rendering, keyword search, date selection, polling auto-refresh, and download. Additionally, replace the current zip-archiving log maintenance with a simple retention-days cleanup that is configurable from the system settings page.

## Scope

- Add a backend `log-viewer` module (controller / service / route) that parses existing log files and exposes read-only query endpoints.
- Add a frontend top-level admin page at `/log-viewer`, registered alongside `sqlite-admin`, plus an admin-only entry card on the home page.
- Support log-type switching (普通日志 / 数据库日志), date selection, level multi-select filtering with per-level colors, keyword search, newest-first pagination, polling auto-refresh, and raw-file download.
- Remove all log compression/zip-archiving logic and delete all previously generated zip archives.
- Add a single, unified, configurable "日志保留天数" system setting (default 10), and switch log maintenance to retention-based deletion of raw `.log` files.
- All new user-visible copy goes through i18n (frontend and backend), zh-CN and en-US.

## Non-Goals

- No database storage of logs and no custom log4js DB appender.
- No WebSocket real-time push (auto-refresh is polling).
- No log editing or deletion from the viewer UI.
- No cross-date aggregated search (queries are scoped to a single date file).
- No separate retention values per log type.
- No reading/parsing of old zip archives (they are deleted, not browsed).

## Existing Context

- `apps/api/src/utils/logger.ts` configures log4js with two dated-file categories: `normal` → `/data/log/normal/normal.<date>.log` and `dataBase` → `/data/log/databse/database.<date>.log` (existing directory spelling kept). Default basic layout produces lines like `[2025-06-13T11:10:00.123] [INFO] category - message`.
- `apps/api/src/utils/log-maintenance.ts` currently zips `.log` files older than 5 days into `archive/` and deletes the originals, on startup and every 12h. `logger.ts` calls `startLogMaintenance(...)` at import time (before `initApp()` runs in `app.ts`).
- Backend modules follow `modules/<name>/{controller,service}` + `<name>.route.ts`, registered in `apps/api/src/routes/index.ts` under the `/api` prefix. Handlers are wrapped with `http()` from `modules/shared/http-handler.ts`; admin guard is `ctx.state.userInfo?.role !== UserRole.ADMIN` → `unauthorized(...)`; routes use `authenticate()`.
- System settings are key/value rows in `volix_system_setting` (`system-setting.model.ts`), read/written via `getSystemConfigData` / `updateSystemConfigData` in `system-setting.service.ts`, with keys defined in `system-setting.constants.ts`. The system page (`apps/web-pc/src/apps/setting/pages/system/index.tsx`) renders an `AppForm` and calls `getSystemConfig` / `updateSystemConfig`.
- Frontend top-level apps live in `apps/web-pc/src/apps/<name>/index.tsx`, registered in `apps/web-pc/src/layouts/router.tsx` with `handle.requiresAuth` and `appHeader`. Service wrappers live in `apps/web-pc/src/services/`. The home admin section card uses `isAdmin` gating in `apps/web-pc/src/apps/home/index.tsx`.
- Shared cross-package types live in `@volix/types`; i18n resources live in `packages/i18n/src/locales/{zh-CN,en-US}/translation.json` and inline `t({ id, defaultMessage })` usage.

## Proposed Design

### Backend: log-viewer module

New module `apps/api/src/modules/log-viewer/` with:

- `service/log-viewer.service.ts` (split into helpers if it approaches 500 lines):
  - Resolve the log directory by type: `normal` → `PATH.log/normal`, `database` → `PATH.log/databse`.
  - List available dates for a type by scanning `.log` filenames and extracting the `yyyy-MM-dd` date.
  - Parse a date's log file into entries `{ timestamp, level, category, message }`:
    - A new entry starts on a line matching the log4js header `^\[<timestamp>\] \[<LEVEL>\] <category> - `.
    - Continuation lines (e.g. stack traces) that do not match the header are appended to the previous entry's `message`.
    - Lines with an unrecognized level fall back to a neutral level (`info`).
  - Apply level filtering (set of levels) and case-insensitive keyword search over the message.
  - Return results newest-first with pagination (`page`, `pageSize`) plus a `total` count.
  - Large-file safety: read the target file from the end up to a bounded byte cap so a 200MB file cannot blow up memory; parse the bounded buffer, then filter/paginate. The cap is an internal constant.
- `controller/log-viewer.controller.ts`: admin-guarded handlers using `ensureAdmin` + `http()`.
- `log-viewer.route.ts`: `prefix: '/log-viewer'`, `router.use(authenticate())`, registered in `routes/index.ts`.

Endpoints (all under `/api/log-viewer`, admin only):

- `GET /dates?type=normal|database` → `{ dates: string[] }` (newest first).
- `GET /entries?type=&date=&levels=&keyword=&page=&pageSize=` → `{ items: LogEntry[], total: number }` (newest first). `levels` is a comma-separated subset; empty/absent means all.
- `GET /download?type=&date=` → streams the raw `.log` file as an attachment.

Input validation: unknown `type` → `badRequest`; missing/invalid `date` → `badRequest`; page/pageSize coerced to sane bounds.

### Backend: log retention setting + maintenance rewrite

- Add `LOG_RETENTION_DAYS_KEY = 'log_retention_days'` to `system-setting.constants.ts`.
- Extend `SystemConfigResponse` / `UpdateSystemConfigPayload` in `@volix/types` with `logRetentionDays: number`.
- `getSystemConfigData` returns the stored value parsed as a positive integer, falling back to default `10`.
- `updateSystemConfigData` validates `logRetentionDays` is an integer in `[1, 365]` (else `badRequest`) and upserts it. Existing fields are unaffected.
- Add a helper `getLogRetentionDays()` that reads the setting and returns the parsed value or `10` on missing/invalid/DB-not-ready.
- Rewrite `log-maintenance.ts`:
  - Remove `defaultZipRunner`, `ensureArchivePath`, `archiveExpiredLogs`, the `zip` execFile dependency, and all archive-related types/constants.
  - Add `deleteExpiredLogs({ retentionDays })`: for each log directory, delete `.log` files whose parsed date is older than `now - retentionDays days`. Keep all files within retention untouched (raw, uncompressed).
  - Also delete every existing `archive/` directory (and its zip contents) under each log directory as a one-time cleanup each run, so old archives are removed.
  - `startLogMaintenance` reads retention via `getLogRetentionDays()` on each run (startup + interval). The startup run uses the default `10` if the DB is not yet ready (no throw); subsequent interval runs pick up the configured value. Keep the existing success/error callbacks shape.

### Frontend: log-viewer page

- New `apps/web-pc/src/apps/log-viewer/index.tsx` (split into components/scss as needed to respect the 500-line limit), registered in `router.tsx` with `requiresAuth` + appHeader, and guarded so non-admins are redirected (consistent with the system page pattern).
- Service `apps/web-pc/src/services/log-viewer.ts` with `getLogDates`, `getLogEntries`, and a download URL helper.
- Controls: Tabs for log type; date selector populated from `getLogDates`; level multi-select; keyword search input; auto-refresh toggle (polling every 4s, off by default); download button; "load more" pagination.
- Display: a virtualized-or-paginated list/table of entries; each row colorized by level (left color bar + level tag + timestamp + message). Long multi-line messages render preformatted.
- Level color map: `trace`=gray, `debug`=blue/teal, `info`=green, `warn`=orange, `error`=red, `fatal`=dark red/magenta.
- Home page: add an admin-only entry card linking to `/log-viewer`.

### Frontend: system settings field

- Add a "日志最多保留天数" numeric input to the system config form, bound to `logRetentionDays`, defaulting to `10`, validated as a positive integer (1–365), saved through the existing `updateSystemConfig` flow.

## Shared Types

- `@volix/types`: add `LogEntry`, `LogType`, request/response types for the log-viewer endpoints, and the `logRetentionDays` additions to system config payload/response.

## i18n

- Add zh-CN and en-US strings for: page/route title and description, log-type labels, level labels, filter/search/auto-refresh/download/load-more controls, empty/error states, the retention-days field label/placeholder/validation messages, and backend validation/error messages.

## Error Handling

- Backend: invalid params → `badRequest`; non-admin → `unauthorized`; missing file/date → empty result rather than 500 where reasonable; unexpected errors flow through the existing `http()` 500 path.
- Frontend: surface request failures via `Toast`; show empty state when a date has no matching entries.
- Maintenance: deletion failures are caught per file and reported through the existing `onError` callback; one failure does not abort the whole run.

## Testing

- Backend unit tests for log line parsing (single-line, multi-line continuation, unknown level), level/keyword filtering, newest-first pagination, and date listing.
- Backend unit tests for `deleteExpiredLogs` (retention boundary, archive directory removal) and `getLogRetentionDays` fallback behavior.
- Backend validation tests for `updateSystemConfigData` retention bounds.
- Reuse existing vitest setup.

## File Size & Structure Constraints

- Keep each code file ≤ 500 lines and each folder ≤ 50 direct children; split service/page into focused files (parsing, file IO, filtering; page controls vs list rendering) if limits are approached.
