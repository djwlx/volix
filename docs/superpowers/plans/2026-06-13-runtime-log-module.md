# Runtime Log Module Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add an admin-only runtime-log viewer page that reads/parses existing log4js files (普通/数据库) with level filtering, colors, search, date selection, polling refresh and download; and replace zip-archiving log maintenance with a configurable retention-days deletion.

**Architecture:** Backend `log-viewer` module parses raw `.log` files and exposes read-only admin endpoints. Log maintenance is rewritten to delete raw files older than a `log_retention_days` system setting (default 10, range 1–365) and to remove old `archive/` zip dirs. Frontend adds a top-level `/log-viewer` page + home card, plus a retention-days field on the system config page.

**Tech Stack:** Koa, log4js, Sequelize, React, Semi Design, vitest, @volix/types, @volix/i18n.

---

## File Structure

Backend:
- `packages/types/src/api/log-viewer.ts` (new) — shared log-viewer types.
- `packages/types/src/api/index.ts` (modify) — export log-viewer types.
- `packages/types/src/api/user.ts` (modify) — add `logRetentionDays`.
- `apps/api/src/modules/user/service/system-setting.constants.ts` (modify) — add key.
- `apps/api/src/modules/user/service/system-setting.service.ts` (modify) — retention read/update + `getLogRetentionDays`.
- `apps/api/src/utils/log-maintenance.ts` (modify) — delete-by-retention, drop zip.
- `apps/api/src/utils/logger.ts` (modify) — update maintenance callbacks.
- `apps/api/src/modules/log-viewer/service/log-viewer.service.ts` (new) — parse/list/filter.
- `apps/api/src/modules/log-viewer/controller/log-viewer.controller.ts` (new).
- `apps/api/src/modules/log-viewer/log-viewer.route.ts` (new).
- `apps/api/src/routes/index.ts` (modify) — register route.
- `apps/api/src/modules/log-viewer/service/__tests__/log-viewer.service.test.ts` (new).
- `apps/api/src/utils/__tests__/log-maintenance.test.ts` (new).

Frontend:
- `apps/web-pc/src/services/log-viewer.ts` (new).
- `apps/web-pc/src/apps/log-viewer/index.tsx` (new) + `log-entry-list.tsx` + `index.module.scss`.
- `apps/web-pc/src/layouts/router.tsx` (modify) — add route.
- `apps/web-pc/src/apps/home/index.tsx` (modify) — admin card.
- `apps/web-pc/src/apps/setting/pages/system/index.tsx` (modify) — retention field.
- `apps/web-pc/src/components/form/index.tsx` (modify) — expose `InputNumber`.
- `packages/i18n/src/locales/{zh-CN,en-US}/translation.json` (modify) — strings.

## Shared types (packages/types/src/api/log-viewer.ts)

```ts
export type LogViewerType = 'normal' | 'database';
export type LogViewerLevel = 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal';

export interface LogViewerEntry {
  timestamp: string;
  level: LogViewerLevel;
  category: string;
  message: string;
}

export interface LogViewerDatesResponse {
  dates: string[];
}

export interface LogViewerEntriesResponse {
  items: LogViewerEntry[];
  total: number;
}
```

## Behavior contracts

- Log header regex per line: `/^\[(.+?)\] \[(\w+)\] (.+?) - /`. Level lowercased; unknown → `info`.
- Continuation lines (no header match) append to previous entry's `message` (joined by `\n`).
- Bounded tail read: cap at 5MB; if larger, read only the last 5MB and drop the first partial line.
- Entries returned newest-first (reverse of file order), then paginated.
- Type→dir/base: `normal`→(`PATH.log/normal`, `normal`); `database`→(`PATH.log/databse`, `database`). File: `${base}.${date}.log`.
- Retention default 10, valid integer 1–365; deletion removes `.log` older than `now - days`; also delete `archive/` dirs.

## Tasks

### Task 1: Shared types + system config type
- Create `log-viewer.ts` types; export in `api/index.ts`.
- Add `logRetentionDays?: number` to `SystemConfigResponse` and `UpdateSystemConfigPayload`.

### Task 2: Retention setting backend
- Add `LOG_RETENTION_DAYS_KEY = 'log_retention_days'`.
- `getLogRetentionDays()` reads setting; returns parsed int in [1,365] else 10; catches errors → 10.
- `getSystemConfigData` includes `logRetentionDays`.
- `updateSystemConfigData` validates and upserts `logRetentionDays`.

### Task 3: Log maintenance rewrite (TDD)
- Test `deleteExpiredLogs` deletes only files older than retention and removes `archive/` dirs; keeps fresh files.
- Implement deletion; remove zip/archive code.
- Update `logger.ts` callbacks to new result fields.

### Task 4: log-viewer service (TDD)
- Tests: single-line parse, multi-line continuation, unknown level→info, level filter, keyword filter, newest-first pagination, date listing.
- Implement service.

### Task 5: log-viewer controller + route + register
- Admin-guarded `getDates`, `getEntries`, `download`.

### Task 6: Frontend service + page + route + home card
- `services/log-viewer.ts`, `apps/log-viewer/*`, router entry, home admin card.

### Task 7: System page retention field + AppForm InputNumber
- Add `InputNumber` to AppForm; add retention field with 1–365 validation.

### Task 8: i18n strings (zh-CN + en-US)

### Task 9: Verify
- `npm run typecheck` (api + web-pc), `npx vitest run`, lint.
