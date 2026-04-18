# 定时任务平台设计

## 目标

当前项目已经有追番相关的定时能力，但调度逻辑直接写在 [apps/api/src/modules/anime-subscription/service/anime-scheduler.service.ts](/Users/bendong/Code/volix/apps/api/src/modules/anime-subscription/service/anime-scheduler.service.ts:1) 中，属于单点硬编码实现：

- 追番 RSS 巡检定时规则固定写死。
- 下载同步定时规则固定写死。
- 其他模块没有统一接入调度的入口。
- 前端无法统一查看“有哪些定时任务正在跑、什么时候跑、跑得怎么样”。
- AI 对话虽然已经具备内部工具执行链路，但还不能创建和管理通用定时任务。

本次设计目标是新增一个统一的“定时任务平台”模块，把当前项目中的定时任务从业务模块中抽离出来，并支持以下能力：

1. 所有定时任务统一注册、统一调度、统一查看状态。
2. 追番任务迁移为平台中的内置任务，而不是继续在业务模块里直接 `scheduleJob(...)`。
3. 前端新增独立“定时任务”模块，展示任务做什么、上次运行时间、下次运行时间、当前状态和相关日志。
4. AI 可以通过对话创建并直接启用新的定时任务。
5. AI 创建的任务支持“受限脚本”执行，而不是无限制的 shell 脚本执行。

## 已确认决策

- 新模块采用平台化方案，而不是只对追番调度做轻量封装。
- 第一版支持两类任务：
  - `builtin`：内置任务，由系统预先定义执行器。
  - `script`：受限脚本任务，由 AI 或后台创建。
- AI 创建任务后直接启用，不经过前端人工审核页面。
- 受限脚本先只支持 JavaScript 运行时，不支持 Bash、Python 等任意系统脚本。
- 受限脚本运行时禁止直接访问 `process`、`fs`、`child_process` 等危险对象。
- 日志仍复用现有 `task` 日志目录，但统一增加定时任务前缀，便于按任务和按运行记录检索。
- 第一版不做分布式调度，不做任务依赖编排，不做脚本版本历史。

## 当前问题

### 调度逻辑与业务逻辑耦合

当前 [apps/api/src/modules/anime-subscription/service/anime-scheduler.service.ts](/Users/bendong/Code/volix/apps/api/src/modules/anime-subscription/service/anime-scheduler.service.ts:1) 直接负责：

- 启动时执行下载同步
- 注册每天 9 点和 21 点的追番巡检任务
- 注册每 5 分钟一次的下载同步任务

这会导致：

- 调度规则不能在前端统一展示。
- 任务的上次运行、下次运行、最近状态没有结构化存储。
- 新模块如果也要做定时执行，很容易继续复制一份自己的调度器。

### 任务可观察性不足

当前追番页面 [apps/web-pc/src/apps/setting/pages/anime-subscription/index.tsx](/Users/bendong/Code/volix/apps/web-pc/src/apps/setting/pages/anime-subscription/index.tsx:1) 可以展示订阅配置、最近判定结果和最近日志，但它看到的是“追番业务视角”，不是“任务调度视角”。

缺失的信息包括：

- 哪些定时任务实际存在
- 每个任务的 cron 表达式和时区
- 上次运行时间
- 下次预计运行时间
- 当前任务状态是否为运行中、暂停、异常
- 最近一次运行是成功还是失败

### AI 无法创建通用定时任务

当前 AI 内部工具体系已经可以扩展业务工具，注册入口在 [apps/api/src/modules/ai/service/ai-internal-tool-bootstrap.service.ts](/Users/bendong/Code/volix/apps/api/src/modules/ai/service/ai-internal-tool-bootstrap.service.ts:1)，但现有工具主要集中在：

- `anime.*`
- `openlist.*`
- `qbit.*`
- `config.*`

这意味着 AI 还没有“创建任务”“启停任务”“查看任务日志”“立即执行任务”这一类统一任务工具，也没有受控脚本执行容器。

## 设计原则

### 统一调度入口

所有定时任务统一由 `scheduled-task` 模块管理，不允许业务模块继续直接注册 `node-schedule` 任务。

### 任务定义与任务执行分离

任务本身负责描述“做什么、何时做、是否启用”，执行记录负责描述“某次运行何时开始、何时结束、结果如何、日志在哪”。

### 内置任务与脚本任务同台管理

前端和 AI 看到的都是统一任务对象，不因为来源不同就分成两套系统。区别只体现在任务类型和执行器来源。

### 受限脚本优先于任意脚本

用户想要的是“AI 创建一个可定时运行的脚本”，但系统不应直接开放任意系统命令执行。第一版必须把脚本限制在平台提供的安全运行时中。

### 可观察性优先

第一版的关键价值不只是“能跑”，还包括“看得见”。任务状态、上次运行、下次运行、日志入口和最近执行结果必须是平台默认能力。

## 总体架构

建议新增独立模块 `scheduled-task`，作为全局定时任务中心。

### 模块拆分

#### 1. `scheduled-task.service.ts`

负责任务定义的增删改查、启停、立即执行和调度刷新。

#### 2. `scheduled-task-run.service.ts`

负责创建运行记录、更新运行状态、关联日志信息、汇总最近运行结果。

#### 3. `scheduled-task-scheduler.service.ts`

负责：

- 启动时加载已启用任务
- 根据 cron 注册 `node-schedule`
- 任务变更后刷新对应 job
- 查询任务下一次触发时间

#### 4. `scheduled-task-script-runtime.service.ts`

负责执行 `script` 任务：

- 创建受限运行上下文
- 校验脚本内容
- 执行脚本
- 注入受控 API
- 控制超时、输出大小和错误包装

#### 5. `scheduled-task-builtin-registry.service.ts`

负责注册所有内置任务执行器，例如：

- `anime.subscription.scan`
- `anime.download.sync`

#### 6. `scheduled-task.controller.ts`

提供后台接口，供前端“定时任务”页面使用。

#### 7. `ai-internal-tool-builtins/scheduled-task-tools.ts`

提供 AI 可调用的任务工具，让 AI 通过现有会话链路创建和管理任务。

## 数据模型

### 1. `scheduled_task`

保存任务定义本身，建议字段如下：

```ts
interface ScheduledTaskEntity {
  id: string | number;
  name: string;
  description?: string | null;
  category: 'anime' | 'script' | 'system' | 'custom';
  task_type: 'builtin' | 'script';
  enabled: boolean;
  cron_expr: string;
  timezone: string;
  status: 'idle' | 'running' | 'paused' | 'error';
  last_run_at?: Date | null;
  next_run_at?: Date | null;
  last_success_at?: Date | null;
  last_error?: string | null;
  script_language?: 'javascript' | null;
  script_content?: string | null;
  script_entry_args?: string | null;
  builtin_handler?: string | null;
  builtin_payload?: string | null;
  created_by?: string | null;
  updated_by?: string | null;
  created_at?: Date;
  updated_at?: Date;
}
```

字段说明：

- `task_type` 区分任务来源。
- `category` 用于前端筛选和展示分组。
- `status` 代表任务定义的当前总体状态，不等于某次运行状态。
- `script_entry_args` 和 `builtin_payload` 统一使用 JSON 字符串持久化，避免第一版过早引入复杂 schema 表。

### 2. `scheduled_task_run`

保存每次运行记录，建议字段如下：

```ts
interface ScheduledTaskRunEntity {
  id: string | number;
  task_id: string | number;
  trigger_type: 'schedule' | 'manual' | 'ai';
  status: 'queued' | 'running' | 'success' | 'failed' | 'timeout';
  started_at?: Date | null;
  finished_at?: Date | null;
  duration_ms?: number | null;
  summary?: string | null;
  error_message?: string | null;
  log_path?: string | null;
  created_at?: Date;
  updated_at?: Date;
}
```

这个表负责支撑：

- 最近一次运行结果
- 历史运行列表
- 前端按任务查看最近执行情况
- AI 按任务读取最近运行概览

### 3. 日志存储策略

第一版不单独建立结构化日志表，而是复用现有目录 `apps/api/data/log/task/`，每次运行统一打以下前缀：

```txt
[SCHEDULED_TASK][task:<taskId>][run:<runId>][stage:<stage>] ...
```

同时把运行记录中的 `log_path` 指向实际日志文件路径，便于前端按任务或按运行读取。

## 受限脚本运行时设计

### 运行时能力

第一版仅支持 `JavaScript` 受限脚本。脚本执行时暴露一个受控上下文，例如：

```ts
interface ScheduledTaskScriptContext {
  logger: {
    info: (message: string, payload?: unknown) => void;
    warn: (message: string, payload?: unknown) => void;
    error: (message: string, payload?: unknown) => void;
  };
  http: {
    fetch: (input: {
      url: string;
      method?: string;
      headers?: Record<string, string>;
      body?: string;
      timeoutMs?: number;
    }) => Promise<{
      status: number;
      headers: Record<string, string>;
      text: string;
    }>;
  };
  tools: {
    anime: {
      listSubscriptions: () => Promise<unknown>;
      triggerSubscriptionCheck: (input: { subscriptionId: string }) => Promise<unknown>;
    };
    openlist: Record<string, unknown>;
    qbit: Record<string, unknown>;
    config: Record<string, unknown>;
  };
  task: {
    id: string;
    name: string;
    triggerType: 'schedule' | 'manual' | 'ai';
    args: Record<string, unknown>;
  };
}
```

### 运行时限制

脚本必须满足以下限制：

- 不暴露 `process`
- 不暴露 `fs`
- 不暴露 `child_process`
- 不允许 `require`
- 不允许动态导入任意模块
- 默认执行超时 30 秒
- 单次日志输出设置大小上限
- 单次网络请求设置超时上限

### 校验策略

任务创建或更新时，脚本内容需要先经过静态校验：

- 不能包含明显危险关键字
- 长度不能超过平台设定阈值
- 不能引用未暴露的上下文变量
- 任务 cron 和时区必须合法

如果校验失败，AI 工具创建流程直接返回失败，不落库。

## 任务生命周期

建议统一为以下状态流转：

### 任务定义状态

- `idle`：任务已启用，等待下次运行
- `running`：当前存在运行中的 `run`
- `paused`：任务被停用
- `error`：最近一次运行失败，且当前未在运行

### 单次运行状态

- `queued`
- `running`
- `success`
- `failed`
- `timeout`

### 生命周期流程

1. 创建任务
2. 校验任务定义
3. 任务落库
4. 如果 `enabled=true`，立即注册调度
5. 到达调度时间后创建 `run`
6. 运行完成后更新 `run` 和任务主状态
7. 前端和 AI 均可查询最近状态与日志

## 追番任务迁移方案

当前追番模块中硬编码的两个调度任务：

- 每天 `09:00`、`21:00` 执行 RSS 巡检
- 每 `5` 分钟执行下载同步

迁移后改为平台中的两个内置任务：

### 1. `anime.subscription.scan`

- `task_type = builtin`
- `category = anime`
- `builtin_handler = anime.subscription.scan`
- 默认 cron：`0 9,21 * * *`
- 执行逻辑：遍历启用中的追番订阅，并调用现有 [triggerAnimeSubscriptionCheckInBackground](/Users/bendong/Code/volix/apps/api/src/modules/anime-subscription/service/anime-subscription.service.ts:1)

### 2. `anime.download.sync`

- `task_type = builtin`
- `category = anime`
- `builtin_handler = anime.download.sync`
- 默认 cron：`*/5 * * * *`
- 执行逻辑：调用现有下载同步服务

### 迁移原则

- 业务实现复用现有追番服务，不重写下载和巡检核心逻辑。
- `anime-scheduler.service.ts` 不再直接注册 `node-schedule`。
- 系统启动时由 `scheduled-task` 模块负责检查内置任务是否存在，不存在则初始化写入。

## 前端设计

建议新增设置页：

- 路径：`/setting/scheduled-task`
- 名称：`定时任务`

### 页面结构

#### 1. 任务列表区

每行展示：

- 任务名
- 类别
- 做什么事
- cron 表达式
- 时区
- 状态
- 上次运行时间
- 下次运行时间
- 最近结果摘要
- 操作按钮

操作按钮包括：

- 查看详情
- 立即执行
- 启用 / 停用

#### 2. 任务详情区

点击展开或进入详情页后展示：

- 任务说明
- 任务类型
- 内置处理器或脚本内容
- 脚本参数 / 内置任务参数
- 最近运行记录
- 最近日志

### 与追番页面的边界

[apps/web-pc/src/apps/setting/pages/anime-subscription/index.tsx](/Users/bendong/Code/volix/apps/web-pc/src/apps/setting/pages/anime-subscription/index.tsx:1) 继续保留，职责收敛为“追番业务配置页”，负责：

- 管理订阅
- 查看条目判定结果
- 手动触发单个订阅检查

而新的“定时任务”页负责：

- 查看系统内所有定时任务
- 查看追番调度任务是否正常
- 查看 AI 创建脚本任务是否正常
- 启停和立即执行任务

## 后端接口设计

建议新增后台接口：

- `GET /scheduled-tasks`
- `GET /scheduled-tasks/:id`
- `POST /scheduled-tasks`
- `PUT /scheduled-tasks/:id`
- `POST /scheduled-tasks/:id/toggle`
- `POST /scheduled-tasks/:id/run-now`
- `GET /scheduled-tasks/:id/runs`
- `GET /scheduled-tasks/:id/logs`

接口职责如下：

- 列表：给前端任务页展示汇总信息
- 详情：返回脚本内容、内置处理器、最近 run 摘要
- 新建 / 更新：供后台表单和 AI 工具复用
- 启停：切换 `enabled` 并刷新调度器
- 立即执行：创建一次 `manual` 或 `ai` 触发的 run
- 日志：按任务或最近运行记录读取相关日志片段

## AI 对话创建任务设计

基于现有 AI 内部工具体系，新增 `scheduled-task` 工具集。

### 建议工具

- `scheduled_task.list`
- `scheduled_task.get_detail`
- `scheduled_task.create`
- `scheduled_task.update`
- `scheduled_task.toggle`
- `scheduled_task.run_now`
- `scheduled_task.get_logs`

### 创建流程

1. 用户在 AI 对话中提出自动化需求。
2. 模型产出结构化任务定义：
   - 名称
   - 说明
   - cron
   - 时区
   - 任务类型
   - 脚本摘要
   - 脚本内容
3. `scheduled_task.create` 对输入进行校验：
   - cron 合法
   - 时区合法
   - 脚本长度合法
   - 脚本仅使用受控能力
4. 创建成功后直接启用。
5. 调度器刷新该任务，下一个周期自动执行。

### 审批策略

虽然本次已确认“AI 生成后直接启用”，但为了避免意外创建高风险任务，建议 `scheduled_task.create` 仍沿用现有内部工具审批框架中的写操作能力定义：

- 该工具属于 `write_high`
- 前端审批卡片只展示任务摘要，不暴露完整敏感上下文

审批通过后立即创建并启用，用户体验仍然是“对话里创建成功后直接生效”。

## 初始化与启动流程

系统启动时建议按以下顺序执行：

1. 注册所有内置任务处理器
2. 检查内置任务是否已存在，不存在则自动插入数据库
3. 加载所有 `enabled=true` 的任务
4. 为每个任务注册 `node-schedule` job
5. 计算并回写 `next_run_at`

当任务发生以下变化时，调度器应刷新对应 job：

- 新建任务
- 更新 cron
- 更新时区
- 启用 / 停用任务
- 删除任务

## 错误处理

### 任务执行失败

如果任务执行失败：

- 当前 run 标记为 `failed`
- 任务主表更新：
  - `status = error`
  - `last_error = error.message`
  - `last_run_at = started_at`
- 日志写入失败原因和执行阶段

### 任务超时

如果脚本超过超时阈值：

- 当前 run 标记为 `timeout`
- 任务主表标记为 `error`
- 日志写入 `timeout`

### 非法脚本

如果 AI 或后台提交非法脚本：

- 不创建任务
- 返回清晰错误信息
- 不进入调度器

## 测试策略

### 后端测试

至少覆盖以下场景：

- 创建内置任务和脚本任务
- 校验非法 cron 和非法时区
- 受限脚本禁止访问危险对象
- 任务启用后正确注册调度
- 任务停用后取消调度
- 内置追番任务执行时正确调用现有服务
- 任务运行成功、失败、超时后的状态更新
- 日志读取接口能返回对应任务相关日志

### 前端测试

至少覆盖以下场景：

- 任务列表展示字段正确
- 状态 tag 显示正确
- 立即执行与启停按钮交互正确
- 任务详情能看到脚本 / 内置处理器、最近运行记录和日志

### AI 工具测试

至少覆盖以下场景：

- AI 创建合法脚本任务成功
- AI 创建非法脚本任务失败
- AI 查看任务列表和详情成功
- AI 调用 `run_now` 能触发一次执行记录

## 第一版实施范围

第一版必须完成：

- 新增 `scheduled-task` 模块
- 新增数据库表：任务表、运行记录表
- 统一调度与执行框架
- 受限 JavaScript 脚本运行时
- 追番两个硬编码任务迁移为内置任务
- 后台新增“定时任务”页面
- AI 新增创建与管理定时任务工具

第一版明确不做：

- Bash / Python 等多语言脚本执行
- 任意系统命令执行
- 分布式 worker
- 任务依赖链
- 可视化编排器
- 脚本版本回滚
- 复杂权限分层

## 风险与取舍

### 为什么第一版不开放任意脚本

如果直接支持 Node/Bash 任意执行，虽然功能最强，但会立即引入：

- 文件系统误删风险
- 外部系统误调用风险
- 密钥泄漏风险
- AI 生成代码直接控制主机环境的风险

因此第一版必须把“脚本能力”落在平台可控运行时里，而不是落到操作系统层。

### 为什么仍然保留写操作审批

虽然已确认任务创建后直接启用，但创建任务本身属于写操作，而且它会带来长期自动执行效果。保留审批卡片是必要的最低安全闸门。

### 为什么追番页面不直接扩展成任务中心

追番页是业务配置页，不适合承载全局调度职责。如果继续堆功能，会把“订阅配置”“资源判定”“任务调度”“脚本执行”混成一个页面，后续维护成本会很高。

## 结论

本次建议采用“统一定时任务平台 + 受限脚本运行时”方案：

- 调度统一收口到 `scheduled-task` 模块
- 追番现有定时器迁移为内置任务
- AI 通过内部工具创建和管理任务
- 前端新增统一任务中心查看状态与日志

这样既能满足“把现有项目中的所有定时任务单独放一个模块”和“通过对话创建定时脚本任务”的目标，也能把风险控制在平台可管理范围内，为后续扩展更多自动化能力留出稳定边界。
