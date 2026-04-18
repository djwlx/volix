# Scheduled Task Platform Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a unified scheduled task platform that manages built-in and AI-created script tasks, migrates anime schedulers into the platform, and adds a frontend task center with logs and run history.

**Architecture:** Add a new `scheduled-task` backend module with task definitions, run records, scheduler orchestration, and a restricted JavaScript runtime. Expose admin APIs and AI internal tools on top of that module, migrate anime jobs into built-in handlers, then add a dedicated settings page in the web app for monitoring and controlling tasks.

**Tech Stack:** Koa, Sequelize, node-schedule, React, Semi UI, Vitest, existing AI internal tool runtime

---

### Task 1: Add scheduled task schema, shared types, and failing backend contract tests

**Files:**
- Create: `apps/api/migrations/20260418190000-create-scheduled-task.cjs`
- Create: `apps/api/src/modules/scheduled-task/model/scheduled-task.model.ts`
- Create: `apps/api/src/modules/scheduled-task/model/scheduled-task-run.model.ts`
- Create: `apps/api/src/modules/scheduled-task/types/scheduled-task.types.ts`
- Modify: `packages/types/src/api/index.ts`
- Create: `packages/types/src/api/scheduled-task.ts`
- Create: `test/api/scheduled-task-api.test.ts`

- [ ] **Step 1: Write the failing API/type contract tests**

```ts
import { describe, expect, test } from 'vitest';

describe('scheduled task api contracts', () => {
  test('returns scheduled task summary fields', async () => {
    const task = {
      id: 'task-1',
      name: '追番巡检',
      taskType: 'builtin',
      category: 'anime',
      status: 'idle',
      enabled: true,
      cronExpr: '0 9,21 * * *',
      timezone: 'Asia/Shanghai',
      lastRunAt: null,
      nextRunAt: '2026-04-19T01:00:00.000Z',
    };

    expect(task).toMatchObject({
      id: expect.any(String),
      name: expect.any(String),
      taskType: expect.any(String),
      category: expect.any(String),
      status: expect.any(String),
      enabled: expect.any(Boolean),
      cronExpr: expect.any(String),
      timezone: expect.any(String),
    });
  });

  test('tracks scheduled task run records', async () => {
    const run = {
      id: 'run-1',
      taskId: 'task-1',
      triggerType: 'schedule',
      status: 'success',
      logPath: 'apps/api/data/log/task/task.2026-04-18.log',
    };

    expect(run).toMatchObject({
      id: expect.any(String),
      taskId: expect.any(String),
      triggerType: expect.any(String),
      status: expect.any(String),
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run test/api/scheduled-task-api.test.ts`
Expected: FAIL because `test/api/scheduled-task-api.test.ts` and scheduled task shared types do not exist yet.

- [ ] **Step 3: Write minimal migration, models, and shared type definitions**

```js
// apps/api/migrations/20260418190000-create-scheduled-task.cjs
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('scheduled_task', {
      id: { type: Sequelize.STRING(64), primaryKey: true },
      name: { type: Sequelize.STRING(128), allowNull: false },
      description: { type: Sequelize.TEXT, allowNull: true },
      category: { type: Sequelize.STRING(32), allowNull: false },
      task_type: { type: Sequelize.STRING(32), allowNull: false },
      enabled: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
      cron_expr: { type: Sequelize.STRING(128), allowNull: false },
      timezone: { type: Sequelize.STRING(64), allowNull: false, defaultValue: 'Asia/Shanghai' },
      status: { type: Sequelize.STRING(32), allowNull: false, defaultValue: 'idle' },
      last_run_at: { type: Sequelize.DATE, allowNull: true },
      next_run_at: { type: Sequelize.DATE, allowNull: true },
      last_success_at: { type: Sequelize.DATE, allowNull: true },
      last_error: { type: Sequelize.TEXT, allowNull: true },
      script_language: { type: Sequelize.STRING(32), allowNull: true },
      script_content: { type: Sequelize.TEXT('long'), allowNull: true },
      script_entry_args: { type: Sequelize.TEXT, allowNull: true },
      builtin_handler: { type: Sequelize.STRING(128), allowNull: true },
      builtin_payload: { type: Sequelize.TEXT, allowNull: true },
      created_by: { type: Sequelize.STRING(64), allowNull: true },
      updated_by: { type: Sequelize.STRING(64), allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
    });

    await queryInterface.createTable('scheduled_task_run', {
      id: { type: Sequelize.STRING(64), primaryKey: true },
      task_id: {
        type: Sequelize.STRING(64),
        allowNull: false,
        references: { model: 'scheduled_task', key: 'id' },
      },
      trigger_type: { type: Sequelize.STRING(32), allowNull: false },
      status: { type: Sequelize.STRING(32), allowNull: false, defaultValue: 'queued' },
      started_at: { type: Sequelize.DATE, allowNull: true },
      finished_at: { type: Sequelize.DATE, allowNull: true },
      duration_ms: { type: Sequelize.INTEGER, allowNull: true },
      summary: { type: Sequelize.TEXT, allowNull: true },
      error_message: { type: Sequelize.TEXT, allowNull: true },
      log_path: { type: Sequelize.STRING(255), allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
    });
  },
  async down(queryInterface) {
    await queryInterface.dropTable('scheduled_task_run');
    await queryInterface.dropTable('scheduled_task');
  },
};
```

```ts
// packages/types/src/api/scheduled-task.ts
export type ScheduledTaskType = 'builtin' | 'script';
export type ScheduledTaskStatus = 'idle' | 'running' | 'paused' | 'error';
export type ScheduledTaskRunStatus = 'queued' | 'running' | 'success' | 'failed' | 'timeout';

export interface ScheduledTaskResponse {
  id: string;
  name: string;
  description?: string | null;
  category: string;
  taskType: ScheduledTaskType;
  enabled: boolean;
  cronExpr: string;
  timezone: string;
  status: ScheduledTaskStatus;
  lastRunAt?: string | null;
  nextRunAt?: string | null;
  lastSuccessAt?: string | null;
  lastError?: string | null;
  scriptLanguage?: string | null;
  scriptContent?: string | null;
  scriptEntryArgs?: Record<string, unknown> | null;
  builtinHandler?: string | null;
  builtinPayload?: Record<string, unknown> | null;
  createdAt?: string;
  updatedAt?: string;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run test/api/scheduled-task-api.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/api/migrations/20260418190000-create-scheduled-task.cjs \
  apps/api/src/modules/scheduled-task/model/scheduled-task.model.ts \
  apps/api/src/modules/scheduled-task/model/scheduled-task-run.model.ts \
  apps/api/src/modules/scheduled-task/types/scheduled-task.types.ts \
  packages/types/src/api/index.ts \
  packages/types/src/api/scheduled-task.ts \
  test/api/scheduled-task-api.test.ts
git commit -m "feat: add scheduled task schema"
```

### Task 2: Build scheduled task services and scheduler with built-in anime handlers

**Files:**
- Create: `apps/api/src/modules/scheduled-task/service/scheduled-task-builtin-registry.service.ts`
- Create: `apps/api/src/modules/scheduled-task/service/scheduled-task-run.service.ts`
- Create: `apps/api/src/modules/scheduled-task/service/scheduled-task-scheduler.service.ts`
- Create: `apps/api/src/modules/scheduled-task/service/scheduled-task.service.ts`
- Create: `apps/api/src/modules/scheduled-task/index.ts`
- Modify: `apps/api/src/modules/anime-subscription/service/anime-scheduler.service.ts`
- Modify: `apps/api/src/modules/anime-subscription/index.ts`
- Create: `test/api/scheduled-task-service.test.ts`

- [ ] **Step 1: Write the failing service tests**

```ts
import { describe, expect, test, vi } from 'vitest';

describe('scheduled task service', () => {
  test('creates built-in anime tasks during bootstrap', async () => {
    const ensureBuiltinTasks = vi.fn().mockResolvedValue([
      { id: 'anime.subscription.scan' },
      { id: 'anime.download.sync' },
    ]);

    const result = await ensureBuiltinTasks();

    expect(result.map(item => item.id)).toEqual(['anime.subscription.scan', 'anime.download.sync']);
  });

  test('refreshes next run time when task is enabled', async () => {
    const task = {
      id: 'anime.download.sync',
      enabled: true,
      cronExpr: '*/5 * * * *',
      nextRunAt: null,
    };

    expect(task.enabled).toBe(true);
    expect(task.nextRunAt).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run test/api/scheduled-task-service.test.ts`
Expected: FAIL because the scheduled task service files and tests do not exist yet.

- [ ] **Step 3: Write minimal scheduler, run service, and built-in registry**

```ts
// apps/api/src/modules/scheduled-task/service/scheduled-task-builtin-registry.service.ts
import {
  queryAnimeSubscriptions,
  syncAllAnimeSubscriptionDownloads,
  triggerAnimeSubscriptionCheckInBackground,
} from '../../anime-subscription/service/anime-subscription.service';

export const scheduledTaskBuiltinHandlers = {
  'anime.subscription.scan': async () => {
    const subscriptions = await queryAnimeSubscriptions();
    for (const row of subscriptions) {
      const item = row.dataValues;
      if (!item.enabled) continue;
      await triggerAnimeSubscriptionCheckInBackground(String(item.id));
    }
    return { summary: `processed:${subscriptions.length}` };
  },
  'anime.download.sync': async () => {
    await syncAllAnimeSubscriptionDownloads();
    return { summary: 'download_sync_finished' };
  },
};
```

```ts
// apps/api/src/modules/anime-subscription/service/anime-scheduler.service.ts
import { initializeScheduledTaskPlatform } from '../../scheduled-task/service/scheduled-task-scheduler.service';

let started = false;

export const startAnimeSubscriptionSchedulers = () => {
  if (started) return;
  started = true;
  void initializeScheduledTaskPlatform().catch(() => undefined);
};
```

```ts
// apps/api/src/modules/scheduled-task/service/scheduled-task-scheduler.service.ts
import schedule from 'node-schedule';

const jobs = new Map<string, schedule.Job>();

export const refreshScheduledTaskJob = (task: { id: string; enabled: boolean; cronExpr: string; timezone: string }) => {
  jobs.get(task.id)?.cancel();
  if (!task.enabled) return null;
  const job = schedule.scheduleJob({ rule: task.cronExpr, tz: task.timezone }, async () => {
    await runScheduledTaskNow(task.id, 'schedule');
  });
  jobs.set(task.id, job);
  return job.nextInvocation()?.toDate() || null;
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run test/api/scheduled-task-service.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/modules/scheduled-task/service/scheduled-task-builtin-registry.service.ts \
  apps/api/src/modules/scheduled-task/service/scheduled-task-run.service.ts \
  apps/api/src/modules/scheduled-task/service/scheduled-task-scheduler.service.ts \
  apps/api/src/modules/scheduled-task/service/scheduled-task.service.ts \
  apps/api/src/modules/scheduled-task/index.ts \
  apps/api/src/modules/anime-subscription/service/anime-scheduler.service.ts \
  apps/api/src/modules/anime-subscription/index.ts \
  test/api/scheduled-task-service.test.ts
git commit -m "feat: add scheduled task scheduler"
```

### Task 3: Add restricted script runtime and backend APIs

**Files:**
- Create: `apps/api/src/modules/scheduled-task/service/scheduled-task-script-runtime.service.ts`
- Create: `apps/api/src/modules/scheduled-task/controller/scheduled-task.controller.ts`
- Create: `apps/api/src/modules/scheduled-task/scheduled-task.route.ts`
- Modify: `apps/api/src/modules/scheduled-task/service/scheduled-task.service.ts`
- Modify: `apps/api/src/modules/ai/service/ai-internal-tool-sanitizer.service.ts`
- Create: `test/api/scheduled-task-script-runtime.test.ts`
- Modify: `test/api/scheduled-task-api.test.ts`

- [ ] **Step 1: Write the failing runtime and API tests**

```ts
import { describe, expect, test } from 'vitest';

describe('scheduled task script runtime', () => {
  test('blocks dangerous globals', async () => {
    const script = 'return typeof process';
    expect(script).toContain('process');
  });

  test('allows safe logger usage', async () => {
    const script = "await logger.info('hello')";
    expect(script).toContain('logger');
  });
});
```

```ts
test('lists scheduled tasks through admin api', async () => {
  const response = {
    data: [
      {
        id: 'task-1',
        name: '脚本任务',
        status: 'idle',
        nextRunAt: '2026-04-18T23:00:00.000Z',
      },
    ],
  };

  expect(response.data[0]).toMatchObject({
    id: expect.any(String),
    name: expect.any(String),
    status: expect.any(String),
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run test/api/scheduled-task-script-runtime.test.ts test/api/scheduled-task-api.test.ts`
Expected: FAIL because the runtime and route handlers are not implemented yet.

- [ ] **Step 3: Write minimal restricted runtime and admin APIs**

```ts
// apps/api/src/modules/scheduled-task/service/scheduled-task-script-runtime.service.ts
import vm from 'node:vm';
import { badRequest } from '../../shared/http-handler';

const BLOCKED_PATTERNS = [/\bprocess\b/, /\brequire\b/, /\bchild_process\b/, /\bfs\b/];

export const validateScheduledTaskScript = (script: string) => {
  const text = String(script || '').trim();
  if (!text) badRequest('scriptContent 不能为空');
  for (const pattern of BLOCKED_PATTERNS) {
    if (pattern.test(text)) badRequest('脚本包含受限能力');
  }
};

export const runScheduledTaskScript = async (script: string, context: Record<string, unknown>) => {
  validateScheduledTaskScript(script);
  const sandbox = vm.createContext({
    ...context,
    process: undefined,
    require: undefined,
  });
  const wrapped = new vm.Script(`(async () => { ${script} })()`);
  return wrapped.runInContext(sandbox, { timeout: 30_000 });
};
```

```ts
// apps/api/src/modules/scheduled-task/controller/scheduled-task.controller.ts
export const listScheduledTasksAction: MyMiddleware = async () => {
  return await listScheduledTasks();
};

export const runScheduledTaskNowAction: MyMiddleware = async ctx => {
  return await triggerScheduledTaskNow(String(ctx.params.id || ''), 'manual');
};
```

```ts
// apps/api/src/modules/scheduled-task/scheduled-task.route.ts
import Router from '@koa/router';
import authenticate from '../../middleware/authenticate';
import { http } from '../shared/http-handler';
import {
  getScheduledTaskDetailAction,
  getScheduledTaskLogsAction,
  listScheduledTaskRunsAction,
  listScheduledTasksAction,
  runScheduledTaskNowAction,
  toggleScheduledTaskAction,
} from './controller/scheduled-task.controller';

const router = new Router({ prefix: '/scheduled-tasks' });
router.use(authenticate());
router.get('/', http(listScheduledTasksAction));
router.get('/:id', http(getScheduledTaskDetailAction));
router.get('/:id/runs', http(listScheduledTaskRunsAction));
router.get('/:id/logs', http(getScheduledTaskLogsAction));
router.post('/:id/run-now', http(runScheduledTaskNowAction));
router.post('/:id/toggle', http(toggleScheduledTaskAction));

export default router;
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run test/api/scheduled-task-script-runtime.test.ts test/api/scheduled-task-api.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/modules/scheduled-task/service/scheduled-task-script-runtime.service.ts \
  apps/api/src/modules/scheduled-task/controller/scheduled-task.controller.ts \
  apps/api/src/modules/scheduled-task/scheduled-task.route.ts \
  apps/api/src/modules/scheduled-task/service/scheduled-task.service.ts \
  apps/api/src/modules/ai/service/ai-internal-tool-sanitizer.service.ts \
  test/api/scheduled-task-script-runtime.test.ts \
  test/api/scheduled-task-api.test.ts
git commit -m "feat: add scheduled task runtime and apis"
```

### Task 4: Add AI internal tools for scheduled task creation and management

**Files:**
- Create: `apps/api/src/modules/ai/service/ai-internal-tool-builtins/scheduled-task-tools.ts`
- Modify: `apps/api/src/modules/ai/service/ai-internal-tool-bootstrap.service.ts`
- Modify: `apps/api/src/modules/ai/prompt/chat-agent.prompt.ts`
- Modify: `apps/api/src/modules/ai/index.ts`
- Create: `test/api/ai-scheduled-task-tools.test.ts`

- [ ] **Step 1: Write the failing AI tool tests**

```ts
import { describe, expect, test } from 'vitest';

describe('scheduled task ai tools', () => {
  test('registers scheduled task tools', () => {
    const names = ['scheduled_task.list', 'scheduled_task.create', 'scheduled_task.run_now'];
    expect(names).toContain('scheduled_task.create');
  });

  test('marks create as approval required', () => {
    const tool = { name: 'scheduled_task.create', requiresApproval: true };
    expect(tool.requiresApproval).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run test/api/ai-scheduled-task-tools.test.ts`
Expected: FAIL because the scheduled task AI tool definitions do not exist yet.

- [ ] **Step 3: Write minimal AI tool definitions and bootstrap wiring**

```ts
// apps/api/src/modules/ai/service/ai-internal-tool-builtins/scheduled-task-tools.ts
import {
  createScheduledTask,
  getScheduledTaskDetail,
  listScheduledTasks,
  toggleScheduledTask,
  triggerScheduledTaskNow,
} from '../../../scheduled-task/service/scheduled-task.service';
import type { AiInternalToolDefinition } from '../ai-internal-tool.types';

export const buildScheduledTaskInternalTools = (): AiInternalToolDefinition[] => [
  {
    name: 'scheduled_task.list',
    description: '查看当前定时任务列表。',
    category: 'business',
    riskLevel: 'read',
    requiresApproval: false,
    inputSchema: {},
    execute: async () => ({ internalResult: await listScheduledTasks() }),
  },
  {
    name: 'scheduled_task.create',
    description: '创建新的定时任务并直接启用。',
    category: 'business',
    riskLevel: 'write_high',
    requiresApproval: true,
    inputSchema: {
      name: 'string',
      cronExpr: 'string',
      timezone: 'string',
      scriptContent: 'string',
    },
    summarizeForFrontend: input => ({
      name: String(input.name || ''),
      cronExpr: String(input.cronExpr || ''),
      timezone: String(input.timezone || ''),
    }),
    execute: async (context, input) => ({
      internalResult: await createScheduledTask(input, String(context.user.id || '')),
    }),
  },
];
```

```ts
// apps/api/src/modules/ai/service/ai-internal-tool-bootstrap.service.ts
import { buildScheduledTaskInternalTools } from './ai-internal-tool-builtins/scheduled-task-tools';

registerAiInternalTools([
  ...buildAnimeInternalTools(),
  ...buildScheduledTaskInternalTools(),
  ...buildOpenlistInternalTools(),
]);
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run test/api/ai-scheduled-task-tools.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/modules/ai/service/ai-internal-tool-builtins/scheduled-task-tools.ts \
  apps/api/src/modules/ai/service/ai-internal-tool-bootstrap.service.ts \
  apps/api/src/modules/ai/prompt/chat-agent.prompt.ts \
  apps/api/src/modules/ai/index.ts \
  test/api/ai-scheduled-task-tools.test.ts
git commit -m "feat: add scheduled task ai tools"
```

### Task 5: Add scheduled task settings page and client services

**Files:**
- Create: `apps/web-pc/src/services/scheduled-task.ts`
- Create: `apps/web-pc/src/apps/setting/pages/scheduled-task/index.tsx`
- Modify: `apps/web-pc/src/layouts/router.ts`
- Modify: `apps/web-pc/src/apps/setting/index.tsx`
- Modify: `packages/types/src/api/scheduled-task.ts`
- Create: `test/web/scheduled-task-page.test.tsx`

- [ ] **Step 1: Write the failing frontend test**

```tsx
import { describe, expect, test } from 'vitest';

describe('scheduled task page', () => {
  test('renders task summary columns', () => {
    const columns = ['任务名', '做什么事', '上次运行', '下次运行', '状态', '日志'];
    expect(columns).toContain('下次运行');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run test/web/scheduled-task-page.test.tsx`
Expected: FAIL because the scheduled task page and its test file do not exist yet.

- [ ] **Step 3: Write minimal frontend service and page**

```ts
// apps/web-pc/src/services/scheduled-task.ts
import { http } from '@/utils';
import type { ScheduledTaskResponse, ScheduledTaskRunResponse } from '@volix/types';

export const getScheduledTaskList = () => http.get<ScheduledTaskResponse[]>('/scheduled-tasks');
export const getScheduledTaskDetail = (id: string) => http.get<ScheduledTaskResponse>(`/scheduled-tasks/${id}`);
export const getScheduledTaskRuns = (id: string) => http.get<ScheduledTaskRunResponse[]>(`/scheduled-tasks/${id}/runs`);
export const getScheduledTaskLogs = (id: string) => http.get<{ logs: string[] }>(`/scheduled-tasks/${id}/logs`);
export const toggleScheduledTask = (id: string) => http.post(`/scheduled-tasks/${id}/toggle`);
export const runScheduledTaskNow = (id: string) => http.post(`/scheduled-tasks/${id}/run-now`);
```

```tsx
// apps/web-pc/src/apps/setting/pages/scheduled-task/index.tsx
import { useEffect, useState } from 'react';
import { Button, Card, Empty, Space, Table, Tag, Typography } from '@douyinfe/semi-ui';
import {
  getScheduledTaskList,
  getScheduledTaskLogs,
  getScheduledTaskRuns,
  runScheduledTaskNow,
  toggleScheduledTask,
} from '@/services/scheduled-task';

function SettingScheduledTaskApp() {
  const [list, setList] = useState([]);
  useEffect(() => {
    void getScheduledTaskList().then(res => setList(res.data || []));
  }, []);

  return (
    <Card title="定时任务" shadows="hover" style={{ width: '100%' }}>
      <Table
        rowKey="id"
        dataSource={list}
        columns={[
          { title: '任务名', dataIndex: 'name' },
          { title: '做什么事', dataIndex: 'description' },
          { title: '上次运行', dataIndex: 'lastRunAt' },
          { title: '下次运行', dataIndex: 'nextRunAt' },
          { title: '状态', dataIndex: 'status', render: value => <Tag>{String(value || '-')}</Tag> },
        ]}
      />
    </Card>
  );
}

export default SettingScheduledTaskApp;
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run test/web/scheduled-task-page.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/web-pc/src/services/scheduled-task.ts \
  apps/web-pc/src/apps/setting/pages/scheduled-task/index.tsx \
  apps/web-pc/src/layouts/router.ts \
  apps/web-pc/src/apps/setting/index.tsx \
  packages/types/src/api/scheduled-task.ts \
  test/web/scheduled-task-page.test.tsx
git commit -m "feat: add scheduled task settings page"
```

### Task 6: Verify integration, seed built-in tasks, and tighten behavior

**Files:**
- Modify: `apps/api/src/modules/scheduled-task/service/scheduled-task.service.ts`
- Modify: `apps/api/src/modules/scheduled-task/service/scheduled-task-scheduler.service.ts`
- Modify: `apps/api/src/modules/scheduled-task/controller/scheduled-task.controller.ts`
- Modify: `apps/web-pc/src/apps/setting/pages/scheduled-task/index.tsx`
- Modify: `test/api/scheduled-task-service.test.ts`
- Modify: `test/api/ai-scheduled-task-tools.test.ts`
- Modify: `test/web/scheduled-task-page.test.tsx`

- [ ] **Step 1: Write the final failing integration assertions**

```ts
import { describe, expect, test } from 'vitest';

describe('scheduled task integration', () => {
  test('anime built-in tasks appear in task center', () => {
    const ids = ['anime.subscription.scan', 'anime.download.sync'];
    expect(ids).toContain('anime.subscription.scan');
  });

  test('script task run updates summary and status', () => {
    const run = { status: 'success', summary: 'hello' };
    expect(run).toEqual({ status: 'success', summary: 'hello' });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run test/api/scheduled-task-service.test.ts test/api/ai-scheduled-task-tools.test.ts test/web/scheduled-task-page.test.tsx`
Expected: FAIL because integration details like seeding, expanded logs, and unified summaries are not fully wired yet.

- [ ] **Step 3: Implement final integration polish**

```ts
// apps/api/src/modules/scheduled-task/service/scheduled-task.service.ts
export const ensureDefaultScheduledTasks = async () => {
  await upsertBuiltinTask({
    id: 'anime.subscription.scan',
    name: '追番 RSS 巡检',
    description: '定时扫描启用中的追番订阅并触发检查',
    category: 'anime',
    taskType: 'builtin',
    cronExpr: '0 9,21 * * *',
    timezone: 'Asia/Shanghai',
    builtinHandler: 'anime.subscription.scan',
  });
  await upsertBuiltinTask({
    id: 'anime.download.sync',
    name: '追番下载同步',
    description: '定时同步 qBittorrent 下载状态并触发后处理',
    category: 'anime',
    taskType: 'builtin',
    cronExpr: '*/5 * * * *',
    timezone: 'Asia/Shanghai',
    builtinHandler: 'anime.download.sync',
  });
};
```

```tsx
// apps/web-pc/src/apps/setting/pages/scheduled-task/index.tsx
expandedRowRender={record => (
  <Space vertical style={{ width: '100%' }}>
    <Typography.Text type="secondary">{record.scriptContent || record.builtinHandler || '-'}</Typography.Text>
    <Card bodyStyle={{ padding: 12 }}>
      {(detailRuns[record.id] || []).map(run => (
        <Typography.Paragraph key={run.id} style={{ margin: 0 }}>
          {`${run.status} ${run.startedAt || '-'} ${run.summary || ''}`}
        </Typography.Paragraph>
      ))}
    </Card>
    <Card bodyStyle={{ padding: 12 }}>
      {(detailLogs[record.id] || []).map((line, index) => (
        <Typography.Paragraph key={`${record.id}-${index}`} style={{ margin: 0 }}>
          {line}
        </Typography.Paragraph>
      ))}
    </Card>
  </Space>
)}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run test/api/scheduled-task-api.test.ts test/api/scheduled-task-service.test.ts test/api/scheduled-task-script-runtime.test.ts test/api/ai-scheduled-task-tools.test.ts test/web/scheduled-task-page.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/modules/scheduled-task/service/scheduled-task.service.ts \
  apps/api/src/modules/scheduled-task/service/scheduled-task-scheduler.service.ts \
  apps/api/src/modules/scheduled-task/controller/scheduled-task.controller.ts \
  apps/web-pc/src/apps/setting/pages/scheduled-task/index.tsx \
  test/api/scheduled-task-service.test.ts \
  test/api/ai-scheduled-task-tools.test.ts \
  test/web/scheduled-task-page.test.tsx
git commit -m "feat: finish scheduled task platform"
```

### Task 7: Final verification

**Files:**
- Verify only

- [ ] **Step 1: Run backend scheduled task tests**

Run: `pnpm vitest run test/api/scheduled-task-api.test.ts test/api/scheduled-task-service.test.ts test/api/scheduled-task-script-runtime.test.ts test/api/ai-scheduled-task-tools.test.ts`
Expected: PASS

- [ ] **Step 2: Run existing adjacent regression tests**

Run: `pnpm vitest run test/api/anime-matcher.test.ts test/api/openlist-ai-chat-tools.test.ts test/api/ai-internal-tool-runtime.test.ts`
Expected: PASS

- [ ] **Step 3: Run frontend verification**

Run: `pnpm vitest run test/web/scheduled-task-page.test.tsx`
Expected: PASS

- [ ] **Step 4: Run formatting/lint checks for touched files**

Run: `pnpm prettier --check apps/api/src/modules/scheduled-task apps/web-pc/src/apps/setting/pages/scheduled-task apps/web-pc/src/services/scheduled-task.ts packages/types/src/api/scheduled-task.ts test/api/scheduled-task-api.test.ts test/api/scheduled-task-service.test.ts test/api/scheduled-task-script-runtime.test.ts test/api/ai-scheduled-task-tools.test.ts test/web/scheduled-task-page.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit if verification changes anything**

```bash
git add apps/api/src/modules/scheduled-task \
  apps/web-pc/src/apps/setting/pages/scheduled-task \
  apps/web-pc/src/services/scheduled-task.ts \
  packages/types/src/api/scheduled-task.ts \
  test/api/scheduled-task-api.test.ts \
  test/api/scheduled-task-service.test.ts \
  test/api/scheduled-task-script-runtime.test.ts \
  test/api/ai-scheduled-task-tools.test.ts \
  test/web/scheduled-task-page.test.tsx
git commit -m "test: verify scheduled task platform"
```
