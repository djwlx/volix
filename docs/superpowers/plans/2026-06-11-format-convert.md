# Format Convert Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` or `superpowers:executing-plans` to implement this plan task-by-task.

**Goal:** Build the new `格式转换` tool with local and OpenList-backed cloud conversion flows, a persisted task queue with restart recovery, system `ffmpeg` / `ffprobe` execution, and a full OpenList SDK method/type surface.

**Architecture:** Split the work into four layers: a grouped OpenList SDK, a backend format-convert module with a single persisted task engine, a React tool page with local/cloud entry points over shared presets, and deployment/docs updates that make `ffmpeg` / `ffprobe` first-class runtime dependencies.

**Tech Stack:** TypeScript, Koa, Sequelize, SQLite, React 18, Semi UI, Vitest, ffmpeg, ffprobe, Docker

## Task Files

- [2026-06-11-format-convert-backend.md](/Users/bendong/Code/volix/docs/superpowers/plans/2026-06-11-format-convert-backend.md)
- [2026-06-11-format-convert-frontend.md](/Users/bendong/Code/volix/docs/superpowers/plans/2026-06-11-format-convert-frontend.md)
- [2026-06-11-format-convert-ops.md](/Users/bendong/Code/volix/docs/superpowers/plans/2026-06-11-format-convert-ops.md)

## File Structure

### OpenList SDK

- Create: `apps/api/src/sdk/openlist/core/request-openlist.ts`
- Create: `apps/api/src/sdk/openlist/core/openlist.types.ts`
- Create: `apps/api/src/sdk/openlist/auth/openlist-auth.ts`
- Create: `apps/api/src/sdk/openlist/user/openlist-user.ts`
- Create: `apps/api/src/sdk/openlist/admin/openlist-admin.ts`
- Create: `apps/api/src/sdk/openlist/fs/openlist-fs.ts`
- Create: `apps/api/src/sdk/openlist/public/openlist-public.ts`
- Create: `apps/api/src/sdk/openlist/share/openlist-share.ts`
- Modify: `apps/api/src/sdk/openlist/create-openlist.sdk.ts`
- Modify: `apps/api/src/sdk/openlist/index.ts`

### Backend format-convert module

- Create: `apps/api/migrations/20260611000000-add-format-convert-task.cjs`
- Create: `apps/api/src/modules/format-convert/model/format-convert-task.model.ts`
- Create: `apps/api/src/modules/format-convert/types/format-convert.types.ts`
- Create: `apps/api/src/modules/format-convert/service/format-convert-option.service.ts`
- Create: `apps/api/src/modules/format-convert/service/format-convert-task-db.service.ts`
- Create: `apps/api/src/modules/format-convert/service/format-convert-workspace.service.ts`
- Create: `apps/api/src/modules/format-convert/service/format-convert-ffmpeg.service.ts`
- Create: `apps/api/src/modules/format-convert/service/format-convert-openlist.service.ts`
- Create: `apps/api/src/modules/format-convert/service/format-convert-runner.service.ts`
- Create: `apps/api/src/modules/format-convert/service/format-convert-queue.service.ts`
- Create: `apps/api/src/modules/format-convert/controller/format-convert.controller.ts`
- Create: `apps/api/src/modules/format-convert/format-convert.route.ts`
- Create: `apps/api/src/modules/format-convert/index.ts`
- Modify: `apps/api/src/modules/index.ts`
- Modify: `apps/api/src/routes/index.ts`
- Modify: `apps/api/app.ts`
- Modify: `apps/api/src/utils/path.ts`
- Modify: `apps/api/src/utils/dependencies.ts`

### Shared HTTP API types

- Create: `packages/types/src/api/format-convert.ts`
- Modify: `packages/types/src/api/index.ts`

### Frontend format-convert app

- Create: `apps/web-pc/src/services/format-convert.ts`
- Create: `apps/web-pc/src/apps/format-convert/index.tsx`
- Create: `apps/web-pc/src/apps/format-convert/index.module.scss`
- Create: `apps/web-pc/src/apps/format-convert/task-status.tsx`
- Create: `apps/web-pc/src/apps/format-convert/preset-options.ts`
- Create: `apps/web-pc/src/apps/format-convert/preset-options.test.ts`
- Create: `apps/web-pc/src/apps/format-convert/task-status.test.tsx`
- Create: `apps/web-pc/src/apps/format-convert/components/local-convert-card.tsx`
- Create: `apps/web-pc/src/apps/format-convert/components/cloud-convert-card.tsx`
- Create: `apps/web-pc/src/apps/format-convert/components/convert-option-form.tsx`
- Create: `apps/web-pc/src/apps/format-convert/components/openlist-browser.tsx`
- Create: `apps/web-pc/src/apps/format-convert/components/task-record-list.tsx`
- Create: `apps/web-pc/src/apps/format-convert/components/index.ts`
- Modify: `apps/web-pc/src/layouts/router.tsx`
- Modify: `apps/web-pc/src/apps/home/index.tsx`

### i18n and docs

- Modify: `packages/i18n/src/locales/zh-CN/translation.json`
- Modify: `packages/i18n/src/locales/en-US/translation.json`
- Modify: `Dockerfile`
- Modify: `README.md`
- Modify: `README.zh-CN.md`
- Modify: `docs/docker.md`
- Modify: `docs/docker.zh-CN.md`

### Test files

- Create: `test/api/openlist-sdk-full-surface.test.ts`
- Create: `test/api/format-convert-option.service.test.ts`
- Create: `test/api/format-convert-runtime.service.test.ts`
- Create: `test/api/format-convert-runner.service.test.ts`
- Create: `test/api/format-convert-queue.service.test.ts`
- Create: `test/api/format-convert-controller.test.ts`

## Execution Order

1. Backend foundation: OpenList SDK, shared types, task schema, ffmpeg helpers.
2. Backend workflow: queue, recovery, OpenList transfer, and Koa APIs.
3. Frontend delivery: route, local/cloud forms, record list, and i18n.
4. Ops and docs: Docker dependency, runtime docs, and focused verification.

## Acceptance Summary

- Full OpenList SDK public surface is available in grouped modules with typed methods.
- `格式转换` supports local upload conversion and OpenList cloud conversion.
- Cloud queue defaults to one running task at a time.
- Local and cloud tasks expose explicit statuses such as `downloading`, `converting`, `uploading`, `download_failed`, `upload_failed`, and `completed`.
- Restart recovery cleans temporary cache, resets failed or in-flight tasks, and retries them automatically.
- Temporary cache lives under `data/cache/media/format-convert/`.
- Local completed outputs are downloadable before manual cleanup.
- New UI copy is fully translated through i18n resources.
