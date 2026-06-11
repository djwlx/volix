# Upload Progress Modal Refresh Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refresh the local upload progress modal so it reads as a cleaner, lighter dedicated upload panel without changing upload behavior.

**Architecture:** Keep the existing `UploadProgressModal` component and improve its internal hierarchy with clearer typography, a muted file info block, a more prominent percent display, and a soft guidance section. Update the modal test and i18n copy alongside the UI so behavior and presentation stay aligned.

**Tech Stack:** React, TypeScript, Vitest, Semi Design, repo i18n JSON resources

---

### Task 1: Refresh modal copy and test expectations

**Files:**
- Modify: `packages/i18n/src/locales/zh-CN/translation.json`
- Modify: `packages/i18n/src/locales/en-US/translation.json`
- Modify: `apps/web-pc/src/apps/format-convert/components/upload-progress-modal.test.ts`

- [ ] **Step 1: Add the failing expectations for the refined modal copy**

Update the test to assert the new subtitle text and keep the existing checks for title, filename, percent, and leave-page hint.

- [ ] **Step 2: Run the modal test to confirm the new expectation fails**

Run: `pnpm test apps/web-pc/src/apps/format-convert/components/upload-progress-modal.test.ts`
Expected: FAIL because the subtitle text is not rendered yet.

- [ ] **Step 3: Add the new subtitle copy to i18n**

Add:

```json
"formatConvert.upload.subtitle": "文件上传完成后会自动创建转换任务。"
```

and:

```json
"formatConvert.upload.subtitle": "The convert task will start automatically after the upload completes."
```

- [ ] **Step 4: Re-run the modal test and confirm it still fails on missing UI**

Run: `pnpm test apps/web-pc/src/apps/format-convert/components/upload-progress-modal.test.ts`
Expected: FAIL because the component has not rendered the subtitle yet.

### Task 2: Implement the lightweight modal refresh

**Files:**
- Modify: `apps/web-pc/src/apps/format-convert/components/upload-progress-modal.tsx`
- Test: `apps/web-pc/src/apps/format-convert/components/upload-progress-modal.test.ts`

- [ ] **Step 1: Update the modal layout**

Render:
- title
- subtitle
- muted file info block
- large numeric percent
- progress bar label and bar
- soft leave-page hint block

Keep `Modal` non-closable and `Progress` as the only progress primitive.

- [ ] **Step 2: Keep the component under the repository line limit**

Run: `wc -l apps/web-pc/src/apps/format-convert/components/upload-progress-modal.tsx`
Expected: a line count comfortably under `500`.

- [ ] **Step 3: Run the modal test to confirm the refreshed UI passes**

Run: `pnpm test apps/web-pc/src/apps/format-convert/components/upload-progress-modal.test.ts`
Expected: PASS

### Task 3: Regression verification

**Files:**
- Test: `apps/web-pc/src/apps/format-convert/components/upload-progress-modal.test.ts`
- Test: `apps/web-pc/src/apps/format-convert/components/local-upload-before-unload.test.ts`
- Test: `apps/web-pc/src/services/format-convert.test.ts`
- Test: `test/api/format-convert-runner.service.test.ts`

- [ ] **Step 1: Run the targeted regression suite**

Run:

```bash
pnpm test apps/web-pc/src/apps/format-convert/components/upload-progress-modal.test.ts apps/web-pc/src/apps/format-convert/components/local-upload-before-unload.test.ts apps/web-pc/src/services/format-convert.test.ts test/api/format-convert-runner.service.test.ts
```

Expected: PASS

- [ ] **Step 2: Run the web-pc typecheck**

Run: `pnpm --filter @volix/web-pc typecheck`
Expected: PASS
