# Home / Setting Migration And AI Organizer Cancel Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move anime subscription, AI file organizer, and scheduled tasks out of settings into top-level home modules, remove the home hero layout, and add direct cancel support for queued/running AI organizer tasks.

**Architecture:** Keep existing feature page components where possible, but rehome them to top-level authenticated routes and update all navigation entry points to match the new information architecture. Implement AI organizer cancellation in the file-backed task queue with cooperative stop checkpoints and a new `canceled` task state exposed end-to-end.

**Tech Stack:** React 18, React Router 7, Semi UI, TypeScript, Koa, Sequelize, file-backed task store

---

## File Map

### Frontend routing and navigation

- Modify: `apps/web-pc/src/layouts/router.ts`
- Modify: `apps/web-pc/src/apps/home/index.tsx`
- Modify: `apps/web-pc/src/apps/home/index.module.scss`
- Modify: `apps/web-pc/src/apps/setting/index.tsx`

### AI organizer frontend

- Modify: `apps/web-pc/src/apps/setting/pages/openlist-ai-organizer/index.tsx`
- Modify: `apps/web-pc/src/services/openlist-ai-organizer.ts`
- Modify: `packages/types/src/api/openlist-ai-organizer.ts`

### AI organizer backend

- Modify: `apps/api/src/modules/openlist-ai-organizer/controller/openlist-ai-organizer.controller.ts`
- Modify: `apps/api/src/modules/openlist-ai-organizer/openlist-ai-organizer.route.ts`
- Modify: `apps/api/src/modules/openlist-ai-organizer/service/openlist-ai-organizer-task.service.ts`
- Modify: `apps/api/src/modules/openlist-ai-organizer/service/openlist-ai-organizer.service.ts`

### Verification

- Test: `pnpm --filter @volix/web-pc typecheck`
- Test: `pnpm --filter @volix/api typecheck`
- Test: authenticated `curl` for `/api/openlist-ai-organizer/tasks/:id/cancel`

## Task 1: Rehome Feature Routes

**Files:**
- Modify: `apps/web-pc/src/layouts/router.ts`

- [ ] **Step 1: Write the failing route expectations**

Document the target route changes in the plan before editing:

```ts
// Desired route ownership after this task:
// /anime-subscription
// /anime-subscription/add
// /anime-subscription/edit/:id
// /openlist-ai-organizer
// /scheduled-task
// Removed from /setting/* children:
// anime-subscription*
// openlist-ai-organizer
// scheduled-task
```

- [ ] **Step 2: Remove business routes from the settings shell and add top-level authenticated routes**

Update `apps/web-pc/src/layouts/router.ts` so the authenticated route tree includes:

```ts
  {
    path: '/anime-subscription',
    Component: RequireAuthRoute,
    ErrorBoundary: AppErrorBoundary,
    children: [{ index: true, Component: SettingAnimeSubscriptionApp }],
  },
  {
    path: '/anime-subscription/add',
    Component: RequireAuthRoute,
    ErrorBoundary: AppErrorBoundary,
    children: [{ index: true, Component: SettingAnimeSubscriptionAddApp }],
  },
  {
    path: '/anime-subscription/edit/:id',
    Component: RequireAuthRoute,
    ErrorBoundary: AppErrorBoundary,
    children: [{ index: true, Component: SettingAnimeSubscriptionEditApp }],
  },
  {
    path: '/openlist-ai-organizer',
    Component: RequireAuthRoute,
    ErrorBoundary: AppErrorBoundary,
    children: [{ index: true, Component: SettingOpenlistAiOrganizerApp }],
  },
  {
    path: '/scheduled-task',
    Component: RequireAuthRoute,
    ErrorBoundary: AppErrorBoundary,
    children: [{ index: true, Component: SettingScheduledTaskApp }],
  },
```

And remove these from the `/setting` children list:

```ts
{ path: 'anime-subscription', Component: SettingAnimeSubscriptionApp },
{ path: 'anime-subscription/add', Component: SettingAnimeSubscriptionAddApp },
{ path: 'anime-subscription/edit/:id', Component: SettingAnimeSubscriptionEditApp },
{ path: 'openlist-ai-organizer', Component: SettingOpenlistAiOrganizerApp },
{ path: 'scheduled-task', Component: SettingScheduledTaskApp },
```

- [ ] **Step 3: Run frontend typecheck to verify route references compile**

Run: `pnpm --filter @volix/web-pc typecheck`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add apps/web-pc/src/layouts/router.ts
git commit -m "refactor: move feature routes out of settings"
```

## Task 2: Replace Home Hero With Modular Cards

**Files:**
- Modify: `apps/web-pc/src/apps/home/index.tsx`
- Modify: `apps/web-pc/src/apps/home/index.module.scss`

- [ ] **Step 1: Write the failing UI target checklist**

Document the expected `home` structure:

```ts
// Remove:
// hero
// heroMain
// heroStats
// hero actions
//
// Keep:
// card sections / grid
// admin-aware visibility
//
// Add cards for:
// /ai
// /anime-subscription
// /openlist-ai-organizer
// /scheduled-task
// /setting/info
```

- [ ] **Step 2: Update the home page JSX to a fully modular card layout**

Edit `apps/web-pc/src/apps/home/index.tsx` to:

- remove the hero `<section className={styles.hero}>...`
- remove hero-only imports such as `Button`, `Tag`, `IconBolt`, `IconComment`
- add cards for:

```tsx
<AppCard title="AI 助手" description="统一会话、工具执行与审批确认。" link="/ai" ... />
<AppCard title="自动追番" description="查看和维护追番任务。" link="/anime-subscription" ... />
<AppCard title="AI 文件整理" description="分析目录、确认计划并执行整理。" link="/openlist-ai-organizer" ... />
<AppCard title="定时任务" description="查看和执行系统定时任务。" link="/scheduled-task" ... />
<AppCard title="设置" description="进入配置中心管理账号与系统配置。" link="/setting/info" ... />
```

- [ ] **Step 3: Remove hero styles and keep the grid responsive**

Delete hero-specific rules from `apps/web-pc/src/apps/home/index.module.scss`:

```scss
.hero { ... }
.heroMain { ... }
.heroBadge { ... }
.heroTitle { ... }
.heroDescription { ... }
.heroActions { ... }
.heroStats { ... }
.heroStatCard { ... }
.heroStatValue { ... }
.heroStatLabel { ... }
```

Keep and tune:

```scss
.content { ... }
.sectionTitleRow { ... }
.cardGrid { ... }
```

- [ ] **Step 4: Run frontend typecheck**

Run: `pnpm --filter @volix/web-pc typecheck`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/web-pc/src/apps/home/index.tsx apps/web-pc/src/apps/home/index.module.scss
git commit -m "refactor: simplify home into modular feature cards"
```

## Task 3: Narrow Settings To Configuration Only

**Files:**
- Modify: `apps/web-pc/src/apps/setting/index.tsx`

- [ ] **Step 1: Write the failing navigation checklist**

```ts
// Remove from settings nav:
// anime-subscription
// scheduled-task
// openlist-ai-organizer
//
// Keep:
// info
// user
// role
// system
// config/*
```

- [ ] **Step 2: Update active key resolution and nav items**

Edit `apps/web-pc/src/apps/setting/index.tsx` to remove these pathname branches:

```ts
if (location.pathname.startsWith('/setting/anime-subscription')) { ... }
if (location.pathname.startsWith('/setting/openlist-ai-organizer')) { ... }
if (location.pathname.startsWith('/setting/scheduled-task')) { ... }
```

And remove corresponding nav items:

```ts
{
  itemKey: 'anime-subscription',
  text: '自动追番',
  ...
},
{
  itemKey: 'scheduled-task',
  text: '定时任务',
  ...
},
{
  itemKey: 'openlist-ai-organizer',
  text: 'AI 文件整理',
  ...
},
```

- [ ] **Step 3: Update settings header copy**

Change:

```tsx
title="后台管理"
```

to:

```tsx
title="设置"
```

and keep the rest of the shell unchanged unless required by type errors.

- [ ] **Step 4: Run frontend typecheck**

Run: `pnpm --filter @volix/web-pc typecheck`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/web-pc/src/apps/setting/index.tsx
git commit -m "refactor: focus settings navigation on configuration"
```

## Task 4: Add AI Organizer Cancel Types And API Surface

**Files:**
- Modify: `packages/types/src/api/openlist-ai-organizer.ts`
- Modify: `apps/web-pc/src/services/openlist-ai-organizer.ts`
- Modify: `apps/api/src/modules/openlist-ai-organizer/controller/openlist-ai-organizer.controller.ts`
- Modify: `apps/api/src/modules/openlist-ai-organizer/openlist-ai-organizer.route.ts`

- [ ] **Step 1: Write the failing type changes**

Extend task status and add cancel response typing:

```ts
export type OpenlistAiOrganizerTaskStatus =
  'queued' | 'running' | 'succeeded' | 'failed' | 'canceled';

export interface CancelOpenlistAiOrganizerTaskResponse {
  taskId: string;
}
```

- [ ] **Step 2: Add frontend service call**

Add to `apps/web-pc/src/services/openlist-ai-organizer.ts`:

```ts
export const cancelOpenlistAiOrganizerTask = (id: string) => {
  return http.post<CancelOpenlistAiOrganizerTaskResponse>(`/openlist-ai-organizer/tasks/${id}/cancel`);
};
```

- [ ] **Step 3: Add backend controller and route**

In controller:

```ts
export const cancelOpenlistAiOrganizerTaskAction: MyMiddleware = async ctx => {
  ensureAdmin(ctx);
  return cancelOpenlistAiOrganizerTask(String(ctx.params.id || ''));
};
```

In route file add:

```ts
.post('/tasks/:id/cancel', http(cancelOpenlistAiOrganizerTaskAction))
```

- [ ] **Step 4: Run both typechecks**

Run:

```bash
pnpm --filter @volix/web-pc typecheck
pnpm --filter @volix/api typecheck
```

Expected: PASS / PASS

- [ ] **Step 5: Commit**

```bash
git add packages/types/src/api/openlist-ai-organizer.ts apps/web-pc/src/services/openlist-ai-organizer.ts apps/api/src/modules/openlist-ai-organizer/controller/openlist-ai-organizer.controller.ts apps/api/src/modules/openlist-ai-organizer/openlist-ai-organizer.route.ts
git commit -m "feat: add ai organizer cancel api surface"
```

## Task 5: Implement Queue Cancellation In The Backend

**Files:**
- Modify: `apps/api/src/modules/openlist-ai-organizer/service/openlist-ai-organizer-task.service.ts`

- [ ] **Step 1: Write the failing backend lifecycle checklist**

```ts
// queued task + cancel => canceled, never runs
// running task + cancel => sets cancelRequested and stops at checkpoint
// canceled task cannot be retried as if still running
// processor must skip canceled queued items
```

- [ ] **Step 2: Add cancellation metadata to task state**

Extend stored task detail usage with a boolean marker:

```ts
type CancelableTaskDetail = OpenlistAiOrganizerTaskDetail & {
  cancelRequested?: boolean;
};
```

Use it consistently when reading/updating task records.

- [ ] **Step 3: Add backend cancel function**

In `openlist-ai-organizer-task.service.ts`, implement:

```ts
export const cancelOpenlistAiOrganizerTask = async (taskId: string) => {
  const task = await patchTask(taskId, current => {
    if (current.status === 'queued') {
      return {
        ...current,
        status: 'canceled',
        currentStage: '任务已停止',
        finishedAt: nowIso(),
        updatedAt: nowIso(),
      };
    }
    if (current.status === 'running') {
      return {
        ...current,
        cancelRequested: true,
        currentStage: '已请求停止，等待当前步骤结束',
        updatedAt: nowIso(),
      };
    }
    badRequest('当前任务不支持停止');
  });

  if (!task) {
    badRequest('任务不存在');
  }
  return { taskId };
};
```

- [ ] **Step 4: Prevent canceled queued items from running**

Update queue pickup logic to skip canceled tasks:

```ts
const index = store.items.findIndex(item => item.status === 'queued' && !item.cancelRequested);
```

and ensure `processQueueLoop()` naturally ignores already-canceled entries.

- [ ] **Step 5: Add cancellation checkpoints in task execution**

Add a helper:

```ts
const assertTaskNotCanceled = async (taskId: string) => {
  const task = await queryOpenlistAiOrganizerTaskDetail(taskId);
  if (task?.status === 'canceled' || (task as any)?.cancelRequested) {
    throw new Error('__OPENLIST_AI_ORG_CANCELED__');
  }
};
```

Call it:

- before expensive analyze work starts
- after analyze result returns but before final patch
- before execute loop starts
- between execute loop iterations

Update `runTask()` catch/finally handling so cancellation becomes:

```ts
status: 'canceled',
currentStage: '任务已停止',
finishedAt: nowIso(),
```

instead of `failed`.

- [ ] **Step 6: Run API typecheck**

Run: `pnpm --filter @volix/api typecheck`
Expected: PASS

- [ ] **Step 7: Verify cancel endpoint manually**

Run:

```bash
TOKEN=$(curl -sS 'http://localhost:3000/api/user/login' -H 'Content-Type: application/json' --data '{"email":"1602951127@qq.com","password":"521521"}' | node -e "const fs=require('fs');const j=JSON.parse(fs.readFileSync(0,'utf8'));process.stdout.write(j.data.token)")
```

Then create or reuse a queued/running organizer task and call:

```bash
curl -sS 'http://localhost:3000/api/openlist-ai-organizer/tasks/<TASK_ID>/cancel' -H "volix-token: $TOKEN" -X POST
```

Expected: JSON with the same `taskId`, and subsequent task detail shows `status: "canceled"` or `cancelRequested` progressing to `canceled`.

- [ ] **Step 8: Commit**

```bash
git add apps/api/src/modules/openlist-ai-organizer/service/openlist-ai-organizer-task.service.ts
git commit -m "feat: support canceling ai organizer tasks"
```

## Task 6: Surface Cancel Controls In The Organizer UI

**Files:**
- Modify: `apps/web-pc/src/apps/setting/pages/openlist-ai-organizer/index.tsx`

- [ ] **Step 1: Write the failing UI checklist**

```ts
// show stop button for queued/running tasks
// disable while request is in flight
// render canceled status tag distinctly
// refresh current task after cancel
```

- [ ] **Step 2: Add cancel action state and handler**

In `apps/web-pc/src/apps/setting/pages/openlist-ai-organizer/index.tsx`, add:

```ts
const [cancelingTaskId, setCancelingTaskId] = useState('');

const handleCancelTask = async (taskId: string) => {
  if (!taskId) return;
  setCancelingTaskId(taskId);
  try {
    const res = await cancelOpenlistAiOrganizerTask(taskId);
    setCurrentTaskId(res.data.taskId);
    await loadTaskList().catch(() => undefined);
    Toast.success('已请求停止任务');
  } catch (error) {
    Toast.error(getHttpErrorMessage(error, '停止任务失败'));
  } finally {
    setCancelingTaskId('');
  }
};
```

- [ ] **Step 3: Add stop buttons and canceled status color**

Update task status tag rendering:

```tsx
color={
  value === 'succeeded' ? 'green' :
  value === 'failed' ? 'red' :
  value === 'running' ? 'blue' :
  value === 'canceled' ? 'orange' :
  'grey'
}
```

Add `停止任务` button in:

- current task header area when `currentTaskDetail?.status` is `queued` or `running`
- table operation column for rows in `queued` or `running`

- [ ] **Step 4: Run frontend typecheck**

Run: `pnpm --filter @volix/web-pc typecheck`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/web-pc/src/apps/setting/pages/openlist-ai-organizer/index.tsx
git commit -m "feat: add cancel controls to ai organizer ui"
```

## Task 7: Update All Links To New Top-Level Feature Paths

**Files:**
- Modify: `apps/web-pc/src/apps/ai-chat/index.tsx`
- Modify: `apps/web-pc/src/apps/setting/pages/anime-subscription/form.tsx`
- Modify: `apps/web-pc/src/apps/setting/pages/anime-subscription/index.tsx`
- Search and modify any remaining `/setting/anime-subscription`, `/setting/openlist-ai-organizer`, `/setting/scheduled-task`

- [ ] **Step 1: Write the failing link checklist**

```ts
// no remaining navigate('/setting/anime-subscription...')
// no remaining navigate('/setting/openlist-ai-organizer')
// no remaining navigate('/setting/scheduled-task')
```

- [ ] **Step 2: Replace old feature paths with new top-level paths**

Examples:

```ts
requestNavigate('/anime-subscription');
requestNavigate('/anime-subscription/add');
requestNavigate(`/anime-subscription/edit/${record.id}`);
navigate('/openlist-ai-organizer');
navigate('/scheduled-task');
```

- [ ] **Step 3: Run repo search to confirm no stale links remain**

Run:

```bash
rg -n "/setting/(anime-subscription|openlist-ai-organizer|scheduled-task)" apps/web-pc/src
```

Expected: no matches

- [ ] **Step 4: Run frontend typecheck**

Run: `pnpm --filter @volix/web-pc typecheck`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/web-pc/src/apps/ai-chat/index.tsx apps/web-pc/src/apps/setting/pages/anime-subscription/form.tsx apps/web-pc/src/apps/setting/pages/anime-subscription/index.tsx
git commit -m "refactor: update feature links to top-level routes"
```

## Task 8: Final Verification

**Files:**
- No new code

- [ ] **Step 1: Run all required typechecks**

Run:

```bash
pnpm --filter @volix/web-pc typecheck
pnpm --filter @volix/api typecheck
```

Expected: PASS / PASS

- [ ] **Step 2: Manually verify route behavior**

Check in browser:

- `/` shows only card-based modular home
- `/setting` menu no longer lists anime/openlist/scheduled-task
- `/anime-subscription` opens the anime subscription page
- `/openlist-ai-organizer` opens organizer page
- `/scheduled-task` opens scheduled task page

- [ ] **Step 3: Manually verify cancel behavior**

In browser:

- create a new organizer analyze task
- click `停止任务` while queued or running
- verify task eventually shows `canceled`
- verify no further work continues after cancellation checkpoint

- [ ] **Step 4: Final commit**

```bash
git add .
git commit -m "feat: migrate feature modules to home and add organizer cancel"
```

## Self-Review

- Spec coverage: covered home migration, settings narrowing, route migration, organizer cancel API, backend queue state, frontend stop controls, and verification.
- Placeholder scan: no TODO/TBD placeholders remain.
- Type consistency: uses `canceled` consistently across types, API, backend store, and UI.
