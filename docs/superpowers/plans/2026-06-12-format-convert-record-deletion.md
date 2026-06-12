# Format Convert Record Deletion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add single-row and multi-select deletion for finished format convert records, deleting both local artifacts and the task records.

**Architecture:** Extend the existing task history table with Semi Table `rowSelection`, replace row-level cleanup with record deletion, and add backend single-delete and batch-delete endpoints that reuse artifact cleanup before removing task rows. Keep running and pending tasks visible but ineligible for deletion in both frontend and backend.

**Tech Stack:** React 18, Semi UI Table/Modal, Vitest, Koa, Sequelize, existing format-convert services

---

### Task 1: Add backend deletion routes and persistence helpers

**Files:**
- Modify: `apps/api/src/modules/format-convert/format-convert.route.ts`
- Modify: `apps/api/src/modules/format-convert/service/format-convert-task-db.service.ts`
- Test: `test/api/format-convert-controller.test.ts`
- Test: `test/api/format-convert-task-db.service.test.ts`

- [ ] Write failing tests for new route registration and any new task-db helper behavior.
- [ ] Run the targeted backend tests and confirm the new assertions fail first.
- [ ] Implement minimal task-db helpers for listing and deleting owned tasks by id set, then add the single and batch delete routes.
- [ ] Re-run the targeted backend tests and confirm they pass.

### Task 2: Implement backend single-delete and batch-delete logic

**Files:**
- Modify: `apps/api/src/modules/format-convert/controller/format-convert.controller.ts`
- Modify: `apps/api/src/modules/format-convert/service/format-convert-artifact.service.ts` if a shared predicate/helper is needed
- Create or Modify: shared format-convert status helper in the existing status/constants location
- Test: `test/api/format-convert-controller.test.ts`

- [ ] Write failing controller-level tests for deleting one finished task, batch deleting multiple finished tasks, and rejecting or ignoring non-finished tasks.
- [ ] Run the targeted controller tests and confirm they fail for the new cases.
- [ ] Implement minimal single-delete and batch-delete handlers that clean local artifacts first, then delete owned finished task rows, returning `deletedCount` for batch requests.
- [ ] Re-run the targeted controller tests and confirm they pass.

### Task 3: Add frontend deletion service calls and page wiring

**Files:**
- Modify: `apps/web-pc/src/services/format-convert.ts`
- Modify: `apps/web-pc/src/apps/format-convert/index.tsx`
- Test: `apps/web-pc/src/services/format-convert.test.ts`

- [ ] Write failing service tests for the new single-delete and batch-delete API calls.
- [ ] Run the targeted service tests and confirm the new cases fail first.
- [ ] Implement the minimal service wrappers and wire page-level callbacks for single delete and batch delete, including refresh and toast handling.
- [ ] Re-run the targeted service tests and confirm they pass.

### Task 4: Upgrade the record table to support row deletion and multi-select batch deletion

**Files:**
- Modify: `apps/web-pc/src/apps/format-convert/components/task-record-list.tsx`
- Modify: `apps/web-pc/src/apps/format-convert/components/task-record-list.test.ts`

- [ ] Write failing component tests for row delete visibility, disabled checkboxes on non-finished tasks, selectable finished rows, and batch delete callback payloads.
- [ ] Run the targeted component tests and confirm the new cases fail.
- [ ] Implement controlled `rowSelection`, row-level delete actions, header batch delete action, and confirmation flows using existing Semi UI patterns.
- [ ] Re-run the targeted component tests and confirm they pass.

### Task 5: Add i18n copy and full verification

**Files:**
- Modify: `packages/i18n/src/locales/zh-CN/translation.json`
- Modify: `packages/i18n/src/locales/en-US/translation.json`

- [ ] Add all user-visible deletion copy for row delete, batch delete, confirmation content, and success/failure toasts.
- [ ] Run focused backend and frontend tests for format convert deletion flows.
- [ ] Run web typecheck and the relevant backend test suite to verify integration.
