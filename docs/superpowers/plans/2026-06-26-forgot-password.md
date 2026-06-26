# Forgot Password Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add email-based forgot-password support with both verification-code and mail-link reset flows.

**Architecture:** Reuse the existing SMTP mailer and in-memory verification cache patterns in the user module. Add two public auth endpoints, extend login-page state to support forgot/reset modes, and wire query-string token prefill for direct email-link entry.

**Tech Stack:** Koa, Sequelize, TypeScript, Vitest, React, Semi UI, i18n

---

### Task 1: Add shared types and service tests

**Files:**
- Modify: `packages/types/src/api/user.ts`
- Modify: `apps/web-pc/src/services/user.ts`
- Modify: `test/api/forgot-password-api.test.ts`
- Modify: `apps/web-pc/src/services/__tests__/user.test.ts`

- [ ] Add forgot-password request/response types and client methods.
- [ ] Write failing backend/API tests for sending reset mail and resetting password with code/token.
- [ ] Write failing frontend service tests for the new API calls.

### Task 2: Add reset mail + token/code backend flow

**Files:**
- Modify: `apps/api/src/modules/user/service/email.service.ts`
- Modify: `apps/api/src/modules/user/controller/auth.controller.ts`
- Modify: `apps/api/src/modules/user/user.route.ts`
- Modify: `apps/api/src/modules/user/controller/index.ts`
- Modify: `apps/api/src/modules/user/service/user.service.ts`

- [ ] Add in-memory reset-password token/code helpers and reset mail sender.
- [ ] Add `POST /user/forgot-password-code`.
- [ ] Add `POST /user/reset-password`.
- [ ] Ensure password updates are hashed.
- [ ] Run focused tests red-green.

### Task 3: Extend auth page for forgot/reset flows

**Files:**
- Modify: `apps/web-pc/src/apps/auth/index.tsx`
- Modify: `packages/i18n/src/locales/zh-CN/translation.json`
- Modify: `packages/i18n/src/locales/en-US/translation.json`

- [ ] Add login/register/forgot/reset page state.
- [ ] Support entering email + code + new password.
- [ ] Support reading `token` and `email` from URL query for direct mail-link entry.
- [ ] Keep copy fully in i18n.

### Task 4: Verify end-to-end behavior

**Files:**
- Modify as needed based on failures above.

- [ ] Run focused tests for backend and frontend auth flows.
- [ ] Run `pnpm --filter @volix/api typecheck`.
- [ ] Run `pnpm --filter @volix/web-pc typecheck`.
- [ ] Confirm no regressions in existing auth behavior.
