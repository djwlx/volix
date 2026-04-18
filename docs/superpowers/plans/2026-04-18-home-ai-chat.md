# Home AI Chat Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Promote AI chat to a first-class home feature with a featured home card and a standalone ChatGPT-style chat workspace.

**Architecture:** Keep backend contracts unchanged and focus on frontend restructuring. Reuse the existing AI service layer, move chat UI out of settings into a dedicated app page, and rework the layout into a two-column workspace with inline tool cards.

**Tech Stack:** React, React Router, Semi UI, SCSS modules, existing AI SSE service

---

### Task 1: Extract AI chat into a standalone app page

**Files:**
- Create: `apps/web-pc/src/apps/ai-chat/index.tsx`
- Create: `apps/web-pc/src/apps/ai-chat/index.module.scss`
- Modify: `apps/web-pc/src/layouts/router.ts`

- [ ] Move current AI chat page out of settings into a standalone authenticated route such as `/ai`.
- [ ] Replace setting outlet dependencies with direct auth/user hooks.
- [ ] Preserve existing conversation/message/tool/SSE behavior while changing layout to a left sidebar plus main chat column.

### Task 2: Redesign the AI chat UI

**Files:**
- Modify: `apps/web-pc/src/apps/ai-chat/index.tsx`
- Modify: `apps/web-pc/src/apps/ai-chat/index.module.scss`

- [ ] Add ChatGPT-style shell: header, conversation sidebar, wide chat stream, floating composer.
- [ ] Render tool approval and tool results inline inside the message stream instead of a permanent third column.
- [ ] Add responsive behavior so sidebar collapses or stacks on smaller screens.

### Task 3: Upgrade the home page entry

**Files:**
- Modify: `apps/web-pc/src/apps/home/index.tsx`
- Modify: `apps/web-pc/src/apps/home/index.module.scss`

- [ ] Add a featured AI assistant hero card near the top of the authenticated home view.
- [ ] Keep the existing application grid below it.
- [ ] Make the featured card navigate directly to `/ai`.

### Task 4: Clean up settings navigation

**Files:**
- Modify: `apps/web-pc/src/apps/setting/index.tsx`
- Modify: `apps/web-pc/src/layouts/router.ts`

- [ ] Remove or redirect the old settings AI chat entry so there is only one primary chat destination.
- [ ] Keep system/admin areas intact and avoid breaking other settings navigation.

### Task 5: Verify

**Files:**
- Modify: none

- [ ] Run `pnpm --filter @volix/web-pc build`.
- [ ] Run `pnpm --filter @volix/api build` to ensure shared types remain compatible.
- [ ] Manually sanity-check route transitions and auth-gated access.

