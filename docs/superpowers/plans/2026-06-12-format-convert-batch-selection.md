# Format Convert Batch Selection Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a first-pass batch conversion workbench that supports local multi-file upload and OpenList tree-based multi-file selection, then submits one task per selected file.

**Architecture:** Keep the backend single-task APIs unchanged and batch on the web client. Split the current oversized convert task card into focused UI pieces, add deterministic batch filename helpers, and verify behavior with helper and component tests first.

**Tech Stack:** React 18, Semi UI, Vitest, i18next, existing format-convert service APIs

---

### Task 1: Add batch naming and selection helpers

**Files:**
- Modify: `apps/web-pc/src/apps/format-convert/preset-options.ts`
- Test: `apps/web-pc/src/apps/format-convert/preset-options.test.ts`

- [ ] Write failing tests for automatic batch naming suffixes and multi-file custom-name lock behavior.
- [ ] Run the preset option tests and confirm the new cases fail first.
- [ ] Implement minimal helper functions for automatic batch target names and multi-file mode detection.
- [ ] Re-run the preset option tests and confirm they pass.

### Task 2: Split the convert task card into smaller workbench parts

**Files:**
- Modify: `apps/web-pc/src/apps/format-convert/components/convert-task-card.tsx`
- Create: `apps/web-pc/src/apps/format-convert/components/source-mode-switch.tsx`
- Create: `apps/web-pc/src/apps/format-convert/components/selected-file-basket.tsx`
- Create: `apps/web-pc/src/apps/format-convert/components/local-batch-upload.tsx`
- Create: `apps/web-pc/src/apps/format-convert/components/cloud-source-tree.tsx`

- [ ] Add component-level failing tests for basket rendering and batch source selection interactions.
- [ ] Run the targeted component tests and confirm the new expectations fail.
- [ ] Refactor the current card into smaller components while preserving existing form behavior.
- [ ] Re-run the targeted component tests and confirm they pass.

### Task 3: Implement batch local/cloud submission

**Files:**
- Modify: `apps/web-pc/src/apps/format-convert/components/convert-task-card.tsx`
- Modify: `apps/web-pc/src/apps/format-convert/components/upload-progress-modal.tsx`
- Test: `apps/web-pc/src/services/format-convert.test.ts`

- [ ] Add failing tests around sequential local upload progress reporting and batch cloud task creation inputs where practical.
- [ ] Run the targeted tests and verify red.
- [ ] Implement sequential local upload submission, sequential cloud task creation, and richer progress modal props.
- [ ] Re-run the targeted tests and verify green.

### Task 4: Add i18n copy and verify

**Files:**
- Modify: `packages/i18n/src/locales/zh-CN/translation.json`
- Modify: `packages/i18n/src/locales/en-US/translation.json`

- [ ] Add all new user-visible copy for batch mode, upload prompts, basket actions, and naming hints.
- [ ] Run web tests plus typecheck/build verification for the touched frontend.
