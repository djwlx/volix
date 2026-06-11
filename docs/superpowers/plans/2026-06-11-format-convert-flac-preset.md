# Format Convert FLAC Preset Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add `FLAC` as a selectable output/audio codec and provide a preset that extracts audio from video or audio sources into lossless `FLAC`.

**Architecture:** Extend the shared format-convert type definitions first so API and web UI consume the same expanded option set. Then update preset normalization and UI behavior so `FLAC` is treated as an audio-only target that hides video-only controls and is exposed as a new default preset, with tests covering both shared option logic and frontend preview behavior.

**Tech Stack:** TypeScript, Vitest, React, shared `@volix/types`, i18n JSON resources

---

### Task 1: Extend shared format-convert definitions

**Files:**
- Modify: `packages/types/src/api/format-convert.ts`
- Test: `test/api/format-convert-option.service.test.ts`

- [ ] Add failing assertions for `flac` output format support, `flac` audio codec support, and the new preset id in `test/api/format-convert-option.service.test.ts`.
- [ ] Run: `pnpm test test/api/format-convert-option.service.test.ts`
- [ ] Update `packages/types/src/api/format-convert.ts` to add `flac` to output formats, add `flac` to audio codecs, and add a preset definition for lossless audio conversion.
- [ ] Re-run: `pnpm test test/api/format-convert-option.service.test.ts`

### Task 2: Update frontend preset/options behavior

**Files:**
- Modify: `apps/web-pc/src/apps/format-convert/preset-options.ts`
- Test: `apps/web-pc/src/apps/format-convert/preset-options.test.ts`

- [ ] Add failing tests for `flac` being treated as audio-only and for the new preset populating `flac` output/audio settings.
- [ ] Run: `pnpm test apps/web-pc/src/apps/format-convert/preset-options.test.ts`
- [ ] Update frontend option builders so `flac` appears in format/audio codec options and hides video-only controls like other audio-only targets.
- [ ] Re-run: `pnpm test apps/web-pc/src/apps/format-convert/preset-options.test.ts`

### Task 3: Add preset labels and verify integration

**Files:**
- Modify: `packages/i18n/src/locales/zh-CN/translation.json`
- Modify: `packages/i18n/src/locales/en-US/translation.json`
- Test: `test/api/format-convert-option.service.test.ts`
- Test: `apps/web-pc/src/apps/format-convert/preset-options.test.ts`

- [ ] Add new i18n labels for the `FLAC` preset in both locale files.
- [ ] Run: `pnpm test test/api/format-convert-option.service.test.ts apps/web-pc/src/apps/format-convert/preset-options.test.ts`
- [ ] Run: `pnpm --filter @volix/api typecheck`

