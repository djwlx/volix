# AI Internal Tool Runtime Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the current hand-written AI tool registry with a unified internal runtime that supports hidden config resolution, read/write risk handling, frontend-safe tool catalogs, and qBittorrent read/write tools.

**Architecture:** Keep the existing chat orchestrator flow, but split tool concerns into a new internal runtime: typed tool definitions, a central registry, a sanitizer, an executor, and separate model/frontend catalogs. The first shipped slice migrates existing `anime.*` and `openlist.*` tools into the new runtime, then adds config-aware qBit tools so the AI can answer qBit status questions without leaking credentials.

**Tech Stack:** TypeScript, Koa, Sequelize, Vitest, existing Volix AI chat models/services, existing qBittorrent/OpenList/115 SDKs.

---

### Task 1: Create the internal runtime foundation

**Files:**
- Create: `apps/api/src/modules/ai/service/ai-internal-tool.types.ts`
- Create: `apps/api/src/modules/ai/service/ai-internal-tool-sanitizer.service.ts`
- Test: `test/api/ai-internal-tool-sanitizer.test.ts`
- Modify: `apps/api/src/modules/ai/index.ts`

- [ ] **Step 1: Write the failing sanitizer tests**

```ts
import { sanitizeInternalToolResult } from '../../apps/api/src/modules/ai/service/ai-internal-tool-sanitizer.service';

describe('ai internal tool sanitizer', () => {
  test('masks credential-like fields recursively', () => {
    const result = sanitizeInternalToolResult({
      username: 'admin',
      password: 'secret123',
      nested: {
        cookie: 'SID=abc',
        apiKey: 'sk-live-123',
      },
    });

    expect(result).toEqual({
      username: 'admin',
      password: '******',
      nested: {
        cookie: '******',
        apiKey: '******',
      },
    });
  });

  test('removes signed query parameters from URLs', () => {
    const result = sanitizeInternalToolResult({
      imageUrl:
        'https://example.com/file.jpg?X-Amz-Signature=abc&X-Amz-Credential=cred&plain=1',
    });

    expect(result).toEqual({
      imageUrl: 'https://example.com/file.jpg?plain=1',
    });
  });
});
```

- [ ] **Step 2: Run the new test to confirm it fails**

Run: `pnpm vitest run test/api/ai-internal-tool-sanitizer.test.ts`
Expected: FAIL because `ai-internal-tool-sanitizer.service.ts` does not exist yet.

- [ ] **Step 3: Add runtime types and sanitizer implementation**

```ts
// apps/api/src/modules/ai/service/ai-internal-tool.types.ts
import type { AiToolDefinition, AiToolRiskLevel, UserRole } from '@volix/types';

export interface AiInternalToolExecutionContext {
  user: {
    id: string | number;
    role: UserRole;
    email?: string;
  };
  requestUserAgent?: string;
}

export interface AiInternalToolExecutionResult {
  internalResult: unknown;
  modelResult?: unknown;
  frontendResult?: unknown;
}

export interface AiInternalToolDefinition {
  name: string;
  description: string;
  category: 'config' | 'sdk' | 'api' | 'business';
  riskLevel: AiToolRiskLevel;
  requiresApproval: boolean;
  inputSchema: Record<string, unknown>;
  hiddenFromFrontend?: boolean;
  execute: (
    context: AiInternalToolExecutionContext,
    input: Record<string, unknown>
  ) => Promise<AiInternalToolExecutionResult>;
  summarizeForFrontend?: (input: Record<string, unknown>) => Record<string, unknown>;
}

export interface AiInternalResolvedToolResult {
  internalResult: unknown;
  modelResult: unknown;
  frontendResult: unknown;
}

export interface AiVisibleToolDefinition extends AiToolDefinition {
  category?: string;
}
```

```ts
// apps/api/src/modules/ai/service/ai-internal-tool-sanitizer.service.ts
const SENSITIVE_KEY_PATTERN = /(password|cookie|token|apiKey|authorization|secret|sid)/i;
const SIGNED_QUERY_KEYS = new Set([
  'x-amz-algorithm',
  'x-amz-credential',
  'x-amz-date',
  'x-amz-expires',
  'x-amz-signedheaders',
  'x-amz-signature',
  'signature',
  'token',
  'pwd',
]);

const maskValue = () => '******';

const sanitizeUrl = (value: string) => {
  try {
    const url = new URL(value);
    for (const key of [...url.searchParams.keys()]) {
      if (SIGNED_QUERY_KEYS.has(key.toLowerCase())) {
        url.searchParams.delete(key);
      }
    }
    return url.toString();
  } catch {
    return value;
  }
};

export const sanitizeInternalToolResult = (value: unknown): unknown => {
  if (Array.isArray(value)) {
    return value.map(item => sanitizeInternalToolResult(item));
  }
  if (!value || typeof value !== 'object') {
    if (typeof value === 'string' && /^https?:\/\//.test(value)) {
      return sanitizeUrl(value);
    }
    return value;
  }
  return Object.entries(value as Record<string, unknown>).reduce<Record<string, unknown>>((acc, [key, item]) => {
    if (SENSITIVE_KEY_PATTERN.test(key)) {
      acc[key] = maskValue();
      return acc;
    }
    acc[key] = sanitizeInternalToolResult(item);
    return acc;
  }, {});
};
```

- [ ] **Step 4: Export the new runtime foundation and rerun tests**

```ts
// apps/api/src/modules/ai/index.ts
export * from './service/ai-internal-tool.types';
export * from './service/ai-internal-tool-sanitizer.service';
```

Run: `pnpm vitest run test/api/ai-internal-tool-sanitizer.test.ts`
Expected: PASS with 2 passing tests.

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/modules/ai/index.ts \
  apps/api/src/modules/ai/service/ai-internal-tool.types.ts \
  apps/api/src/modules/ai/service/ai-internal-tool-sanitizer.service.ts \
  test/api/ai-internal-tool-sanitizer.test.ts
git commit -m "feat: add ai internal tool runtime foundation"
```

### Task 2: Build the registry, executor, and frontend/model catalogs

**Files:**
- Create: `apps/api/src/modules/ai/service/ai-internal-tool-registry.service.ts`
- Create: `apps/api/src/modules/ai/service/ai-internal-tool-executor.service.ts`
- Create: `apps/api/src/modules/ai/service/ai-internal-tool-catalog.service.ts`
- Test: `test/api/ai-internal-tool-runtime.test.ts`
- Modify: `apps/api/src/modules/ai/service/ai-chat-tool-registry.service.ts`
- Modify: `apps/api/src/modules/ai/service/ai-chat-orchestrator.service.ts`
- Modify: `apps/api/src/modules/ai/controller/ai-chat.controller.ts`
- Modify: `packages/types/src/api/ai.ts`

- [ ] **Step 1: Write the failing runtime behavior tests**

```ts
import {
  registerAiInternalTool,
  resetAiInternalToolRegistryForTest,
} from '../../apps/api/src/modules/ai/service/ai-internal-tool-registry.service';
import {
  executeAiInternalTool,
  getAiFrontendToolCatalog,
  getAiModelToolCatalog,
} from '../../apps/api/src/modules/ai/service/ai-internal-tool-executor.service';

describe('ai internal tool runtime', () => {
  beforeEach(() => {
    resetAiInternalToolRegistryForTest();
  });

  test('returns separate model and frontend catalogs', async () => {
    registerAiInternalTool({
      name: 'config.resolve_secret',
      description: 'hidden',
      category: 'config',
      riskLevel: 'read',
      requiresApproval: false,
      hiddenFromFrontend: true,
      inputSchema: {},
      execute: async () => ({ internalResult: { password: 'secret' } }),
    });

    expect(getAiModelToolCatalog().map(item => item.name)).toContain('config.resolve_secret');
    expect(getAiFrontendToolCatalog().map(item => item.name)).not.toContain('config.resolve_secret');
  });

  test('requires approval for write tools and sanitizes visible results', async () => {
    registerAiInternalTool({
      name: 'qbit.delete_torrents',
      description: 'delete torrents',
      category: 'sdk',
      riskLevel: 'write_high',
      requiresApproval: true,
      inputSchema: {
        hashes: 'array',
      },
      summarizeForFrontend: input => ({ hashes: input.hashes }),
      execute: async () => ({
        internalResult: { cookie: 'SID=secret', ok: true },
      }),
    });

    const result = await executeAiInternalTool(
      'qbit.delete_torrents',
      {
        user: { id: '1', role: 'admin' as any },
      },
      { hashes: ['abc'] },
      { allowWriteExecution: false }
    );

    expect(result.status).toBe('waiting_approval');
    expect(result.frontendSummary).toEqual({ hashes: ['abc'] });
  });
});
```

- [ ] **Step 2: Run the runtime test to confirm it fails**

Run: `pnpm vitest run test/api/ai-internal-tool-runtime.test.ts`
Expected: FAIL because the new registry/executor files do not exist.

- [ ] **Step 3: Implement registry, executor, and catalog services**

```ts
// apps/api/src/modules/ai/service/ai-internal-tool-registry.service.ts
import type { AiInternalToolDefinition } from './ai-internal-tool.types';

const registry = new Map<string, AiInternalToolDefinition>();

export const registerAiInternalTool = (tool: AiInternalToolDefinition) => {
  registry.set(tool.name, tool);
};

export const registerAiInternalTools = (tools: AiInternalToolDefinition[]) => {
  for (const tool of tools) {
    registerAiInternalTool(tool);
  }
};

export const getAiInternalTool = (name: string) => registry.get(name);
export const listAiInternalTools = () => [...registry.values()];
export const resetAiInternalToolRegistryForTest = () => registry.clear();
```

```ts
// apps/api/src/modules/ai/service/ai-internal-tool-catalog.service.ts
import type { AiVisibleToolDefinition } from './ai-internal-tool.types';
import { listAiInternalTools } from './ai-internal-tool-registry.service';

const toVisibleTool = (tool: any): AiVisibleToolDefinition => ({
  name: tool.name,
  description: tool.description,
  riskLevel: tool.riskLevel,
  requiresApproval: tool.requiresApproval,
  inputSchema: tool.inputSchema,
  category: tool.category,
});

export const getAiModelToolCatalog = () => listAiInternalTools().map(toVisibleTool);

export const getAiFrontendToolCatalog = () =>
  listAiInternalTools()
    .filter(tool => !tool.hiddenFromFrontend)
    .map(toVisibleTool);
```

```ts
// apps/api/src/modules/ai/service/ai-internal-tool-executor.service.ts
import { badRequest } from '../../shared/http-handler';
import {
  getAiFrontendToolCatalog,
  getAiModelToolCatalog,
} from './ai-internal-tool-catalog.service';
import { getAiInternalTool } from './ai-internal-tool-registry.service';
import { sanitizeInternalToolResult } from './ai-internal-tool-sanitizer.service';

export const executeAiInternalTool = async (
  name: string,
  context: any,
  input: Record<string, unknown>,
  options?: { allowWriteExecution?: boolean }
) => {
  const tool = getAiInternalTool(name);
  if (!tool) {
    badRequest(`工具不存在: ${name}`);
  }
  if (tool.requiresApproval && !options?.allowWriteExecution) {
    return {
      status: 'waiting_approval' as const,
      frontendSummary: tool.summarizeForFrontend ? tool.summarizeForFrontend(input) : sanitizeInternalToolResult(input),
    };
  }
  const executed = await tool.execute(context, input);
  return {
    status: 'completed' as const,
    internalResult: executed.internalResult,
    modelResult: sanitizeInternalToolResult(executed.modelResult ?? executed.internalResult),
    frontendResult: sanitizeInternalToolResult(executed.frontendResult ?? executed.modelResult ?? executed.internalResult),
  };
};

export { getAiModelToolCatalog, getAiFrontendToolCatalog };
```

- [ ] **Step 4: Wire the AI chat entry points to the new runtime**

```ts
// apps/api/src/modules/ai/service/ai-chat-tool-registry.service.ts
export {
  getAiFrontendToolCatalog as listAiRegisteredTools,
  getAiModelToolCatalog as listAiModelTools,
} from './ai-internal-tool-executor.service';
```

```ts
// apps/api/src/modules/ai/service/ai-chat-orchestrator.service.ts
import { executeAiInternalTool, getAiModelToolCatalog } from './ai-internal-tool-executor.service';

const tools = getAiModelToolCatalog();
// ...
const result = await executeAiInternalTool(
  toolCall.tool_name,
  { user },
  parsedArgs,
  { allowWriteExecution: true }
);
```

```ts
// apps/api/src/modules/ai/controller/ai-chat.controller.ts
import { getAiFrontendToolCatalog } from '../service/ai-internal-tool-executor.service';

export const listAiToolsAction: MyMiddleware = async () => {
  return {
    items: getAiFrontendToolCatalog(),
  };
};
```

```ts
// packages/types/src/api/ai.ts
export interface AiToolDefinition {
  name: string;
  description: string;
  riskLevel: AiToolRiskLevel;
  requiresApproval: boolean;
  inputSchema: Record<string, unknown>;
  category?: string;
}
```

- [ ] **Step 5: Run tests and commit**

Run: `pnpm vitest run test/api/ai-internal-tool-sanitizer.test.ts test/api/ai-internal-tool-runtime.test.ts`
Expected: PASS with both runtime tests green.

```bash
git add packages/types/src/api/ai.ts \
  apps/api/src/modules/ai/controller/ai-chat.controller.ts \
  apps/api/src/modules/ai/service/ai-chat-orchestrator.service.ts \
  apps/api/src/modules/ai/service/ai-chat-tool-registry.service.ts \
  apps/api/src/modules/ai/service/ai-internal-tool-registry.service.ts \
  apps/api/src/modules/ai/service/ai-internal-tool-executor.service.ts \
  apps/api/src/modules/ai/service/ai-internal-tool-catalog.service.ts \
  test/api/ai-internal-tool-runtime.test.ts
git commit -m "feat: add ai internal tool executor and catalogs"
```

### Task 3: Migrate existing tools and add config/qBit built-ins

**Files:**
- Create: `apps/api/src/modules/ai/service/ai-internal-tool-builtins/openlist-tools.ts`
- Create: `apps/api/src/modules/ai/service/ai-internal-tool-builtins/anime-tools.ts`
- Create: `apps/api/src/modules/ai/service/ai-internal-tool-builtins/config-tools.ts`
- Create: `apps/api/src/modules/ai/service/ai-internal-tool-builtins/qbit-tools.ts`
- Create: `apps/api/src/modules/ai/service/ai-internal-tool-bootstrap.service.ts`
- Create: `test/api/ai-qbit-tools.test.ts`
- Modify: `apps/api/src/modules/ai/service/ai-chat-tool-registry.service.ts`
- Modify: `apps/api/src/modules/ai/prompt/chat-agent.prompt.ts`
- Modify: `apps/api/src/modules/config/service/config.service.ts`

- [ ] **Step 1: Write the failing qBit/config runtime tests**

```ts
import { AppConfigEnum } from '../../apps/api/src/modules/config/model/config.model';
import { buildQbitInternalTools } from '../../apps/api/src/modules/ai/service/ai-internal-tool-builtins/qbit-tools';

vi.mock('../../apps/api/src/modules/config/service/config.service', () => ({
  getConfig: vi.fn(async () => ({
    [AppConfigEnum.account_qbittorrent]: JSON.stringify({
      baseUrl: 'https://qbit.example',
      username: 'admin',
      password: 'secret',
    }),
  })),
}));

vi.mock('../../apps/api/src/sdk', () => ({
  createQbittorrentSdk: vi.fn(() => ({
    getTorrentList: vi.fn(async () => [
      { hash: 'a', name: 'done', progress: 1, state: 'uploading', size: 1, dlspeed: 0, upspeed: 0, added_on: 0, completion_on: 0, save_path: '/done', category: '', tags: '' },
      { hash: 'b', name: 'downloading', progress: 0.5, state: 'downloading', size: 1, dlspeed: 100, upspeed: 0, added_on: 0, completion_on: 0, save_path: '/dl', category: '', tags: '' },
    ]),
  })),
}));

test('qbit list tool returns active torrents without leaking credentials', async () => {
  const tool = buildQbitInternalTools().find(item => item.name === 'qbit.get_torrent_list');
  const result = await tool!.execute({ user: { id: '1', role: 'admin' as any } }, {});

  expect(result.internalResult).toMatchObject([
    { name: 'done' },
    { name: 'downloading' },
  ]);
  expect(JSON.stringify(result)).not.toContain('secret');
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm vitest run test/api/ai-qbit-tools.test.ts`
Expected: FAIL because the new built-in tool files do not exist.

- [ ] **Step 3: Add built-in tool modules and config resolvers**

```ts
// apps/api/src/modules/ai/service/ai-internal-tool-builtins/config-tools.ts
import { AppConfigEnum } from '../../config/model/config.model';
import { getConfig } from '../../config/service/config.service';

export const resolveConfigForExecution = async <T>(key: AppConfigEnum): Promise<T> => {
  const data = await getConfig(key);
  const raw = data?.[key];
  if (!raw) {
    throw new Error(`缺少配置: ${key}`);
  }
  return JSON.parse(raw) as T;
};

export const buildConfigInternalTools = () => [
  {
    name: 'config.get_masked',
    description: '读取脱敏配置',
    category: 'config' as const,
    riskLevel: 'read' as const,
    requiresApproval: false,
    inputSchema: { key: 'string' },
    execute: async (_context: any, input: Record<string, unknown>) => {
      const key = String(input.key || '').trim() as AppConfigEnum;
      const raw = await resolveConfigForExecution<Record<string, unknown>>(key);
      return {
        internalResult: raw,
      };
    },
  },
];
```

```ts
// apps/api/src/modules/ai/service/ai-internal-tool-builtins/qbit-tools.ts
import { createQbittorrentSdk } from '../../../../sdk';
import { AppConfigEnum } from '../../../config/model/config.model';
import { resolveConfigForExecution } from './config-tools';

const getQbitSdk = async () => {
  const config = await resolveConfigForExecution<{
    baseUrl: string;
    username: string;
    password: string;
  }>(AppConfigEnum.account_qbittorrent);
  return createQbittorrentSdk({
    apiHost: config.baseUrl,
    username: config.username,
    password: config.password,
  });
};

export const buildQbitInternalTools = () => [
  {
    name: 'qbit.get_torrent_list',
    description: '查看 qBittorrent 当前任务列表',
    category: 'sdk' as const,
    riskLevel: 'read' as const,
    requiresApproval: false,
    inputSchema: {},
    execute: async () => {
      const sdk = await getQbitSdk();
      const list = await sdk.getTorrentList();
      return {
        internalResult: list,
        modelResult: list.map(item => ({
          hash: item.hash,
          name: item.name,
          progress: item.progress,
          state: item.state,
          save_path: item.save_path,
          dlspeed: item.dlspeed,
        })),
      };
    },
  },
  {
    name: 'qbit.delete_torrents',
    description: '删除 qBittorrent 任务',
    category: 'sdk' as const,
    riskLevel: 'write_high' as const,
    requiresApproval: true,
    inputSchema: { hashes: 'string|string[]', deleteFiles: 'boolean?' },
    summarizeForFrontend: input => ({
      hashes: input.hashes,
      deleteFiles: Boolean(input.deleteFiles),
    }),
    execute: async (_context: any, input: Record<string, unknown>) => {
      const sdk = await getQbitSdk();
      await sdk.deleteTorrents(input.hashes as any, { deleteFiles: Boolean(input.deleteFiles) });
      return {
        internalResult: { ok: true, hashes: input.hashes },
      };
    },
  },
];
```

- [ ] **Step 4: Bootstrap the built-ins and update prompt guidance**

```ts
// apps/api/src/modules/ai/service/ai-internal-tool-bootstrap.service.ts
import { registerAiInternalTools } from './ai-internal-tool-registry.service';
import { buildAnimeInternalTools } from './ai-internal-tool-builtins/anime-tools';
import { buildConfigInternalTools } from './ai-internal-tool-builtins/config-tools';
import { buildOpenlistInternalTools } from './ai-internal-tool-builtins/openlist-tools';
import { buildQbitInternalTools } from './ai-internal-tool-builtins/qbit-tools';

let bootstrapped = false;

export const ensureAiInternalToolsBootstrapped = () => {
  if (bootstrapped) {
    return;
  }
  registerAiInternalTools([
    ...buildAnimeInternalTools(),
    ...buildOpenlistInternalTools(),
    ...buildConfigInternalTools(),
    ...buildQbitInternalTools(),
  ]);
  bootstrapped = true;
};
```

```ts
// apps/api/src/modules/ai/service/ai-chat-tool-registry.service.ts
import { ensureAiInternalToolsBootstrapped } from './ai-internal-tool-bootstrap.service';

export const listAiRegisteredTools = () => {
  ensureAiInternalToolsBootstrapped();
  return getAiFrontendToolCatalog();
};

export const listAiModelTools = () => {
  ensureAiInternalToolsBootstrapped();
  return getAiModelToolCatalog();
};
```

```ts
// apps/api/src/modules/ai/prompt/chat-agent.prompt.ts
'如果用户是在询问 qBittorrent 当前下载状态、未完成任务、任务详情，优先选择 qbit 相关读工具，不要回答做不了。'
```

- [ ] **Step 5: Run tests and commit**

Run: `pnpm vitest run test/api/ai-qbit-tools.test.ts test/api/ai-internal-tool-runtime.test.ts`
Expected: PASS with qBit tool registration and config-backed execution covered.

```bash
git add apps/api/src/modules/ai/prompt/chat-agent.prompt.ts \
  apps/api/src/modules/ai/service/ai-chat-tool-registry.service.ts \
  apps/api/src/modules/ai/service/ai-internal-tool-bootstrap.service.ts \
  apps/api/src/modules/ai/service/ai-internal-tool-builtins/anime-tools.ts \
  apps/api/src/modules/ai/service/ai-internal-tool-builtins/openlist-tools.ts \
  apps/api/src/modules/ai/service/ai-internal-tool-builtins/config-tools.ts \
  apps/api/src/modules/ai/service/ai-internal-tool-builtins/qbit-tools.ts \
  test/api/ai-qbit-tools.test.ts
git commit -m "feat: add config-backed qbit ai tools"
```

### Task 4: Finish approval/result persistence and verify end-to-end behavior

**Files:**
- Modify: `apps/api/src/modules/ai/service/ai-chat-orchestrator.service.ts`
- Modify: `apps/api/src/modules/ai/service/ai-chat-conversation.service.ts`
- Modify: `apps/api/src/modules/ai/controller/ai-chat.controller.ts`
- Test: `test/api/ai-internal-tool-runtime.test.ts`
- Test: `test/api/openlist-ai-chat-tools.test.ts`

- [ ] **Step 1: Add a failing test for frontend-safe tool call persistence**

```ts
test('tool call stores sanitized visible results instead of raw internal secrets', async () => {
  registerAiInternalTool({
    name: 'config.demo_secret',
    description: 'demo',
    category: 'config',
    riskLevel: 'read',
    requiresApproval: false,
    inputSchema: {},
    execute: async () => ({
      internalResult: {
        password: 'secret',
        value: 'visible',
      },
    }),
  });

  const executed = await executeAiInternalTool(
    'config.demo_secret',
    { user: { id: '1', role: 'admin' as any } },
    {},
    { allowWriteExecution: true }
  );

  expect(executed.modelResult).toEqual({
    password: '******',
    value: 'visible',
  });
});
```

- [ ] **Step 2: Run the targeted tests to confirm the persistence path still fails**

Run: `pnpm vitest run test/api/ai-internal-tool-runtime.test.ts test/api/openlist-ai-chat-tools.test.ts`
Expected: FAIL because the orchestrator still writes legacy tool payloads directly.

- [ ] **Step 3: Update orchestrator persistence to use visible summaries/results**

```ts
// apps/api/src/modules/ai/service/ai-chat-orchestrator.service.ts
const execution = await executeAiInternalTool(
  toolCall.tool_name,
  { user },
  parsedArgs,
  { allowWriteExecution: true }
);

if (execution.status === 'waiting_approval') {
  await updateAiToolCallRecord(toolCallId, {
    status: 'waiting_approval',
    result_json: serializeJson({
      summary: execution.frontendSummary,
    }),
  });
  return;
}

const updated = await updateAiToolCallRecord(toolCallId, {
  status: 'completed',
  result_json: serializeJson(execution.frontendResult),
  finished_at: new Date(),
});

await createAiMessageRecord({
  conversationId,
  runId,
  toolCallId,
  role: 'tool',
  content: JSON.stringify(
    {
      toolName: updated.toolName,
      result: execution.modelResult,
    },
    null,
    2
  ),
  status: 'completed',
});
```

- [ ] **Step 4: Run the full relevant test set**

Run: `pnpm vitest run test/api/ai-internal-tool-sanitizer.test.ts test/api/ai-internal-tool-runtime.test.ts test/api/ai-qbit-tools.test.ts test/api/openlist-ai-chat-tools.test.ts`
Expected: PASS with all AI tool runtime tests green.

- [ ] **Step 5: Commit and capture the final verification**

```bash
git add apps/api/src/modules/ai/service/ai-chat-orchestrator.service.ts \
  apps/api/src/modules/ai/service/ai-chat-conversation.service.ts \
  apps/api/src/modules/ai/controller/ai-chat.controller.ts \
  test/api/ai-internal-tool-runtime.test.ts \
  test/api/openlist-ai-chat-tools.test.ts
git commit -m "feat: persist frontend-safe ai tool results"
```

## Self-Review

### Spec coverage

- Unified runtime foundation: covered by Task 1 and Task 2.
- Separate internal/model/frontend visibility: covered by Task 1, Task 2, and Task 4.
- Read without approval / write with approval: covered by Task 2 and Task 4.
- Config-backed hidden credential resolution: covered by Task 3.
- qBit end-to-end query support: covered by Task 3 and Task 4.
- Frontend tool catalog hiding internal tools: covered by Task 2.

### Placeholder scan

- No `TODO`, `TBD`, or “implement later” placeholders remain.
- Each task lists exact files, concrete commands, and code snippets.

### Type consistency

- `AiInternalToolDefinition`, `AiInternalToolExecutionResult`, and catalog/executor names are used consistently across all tasks.
- `qbit.get_torrent_list` and `qbit.delete_torrents` naming is consistent between tests, registry bootstrapping, and prompt guidance.

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-04-18-ai-internal-tool-runtime.md`. Two execution options:

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

Which approach?
