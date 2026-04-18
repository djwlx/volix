# AI 内部工具 Runtime 设计

## 目标

当前 AI 聊天能力已经具备会话、消息、SSE、工具调用和审批链路，但 AI 真正能用的工具仍然是少量手写注册项，无法覆盖现有 API、SDK 和配置体系。

本次设计的目标是把后端现有能力统一收口为一套“AI 内部工具 Runtime”，让 AI 可以像调用工具一样按需读取配置、创建 SDK、调用服务能力，并满足以下约束：

1. 所有读操作都允许 AI 自主调用。
2. 所有写操作都必须经过前端二次确认后才允许执行。
3. AI 在服务端可以读取明文配置用于真实执行。
4. 密码、Cookie、Token、API Key 等敏感信息不能暴露给前端。
5. 前端不能看到完整内部工具链，只能看到脱敏后的工具信息和审批摘要。

## 已确认决策

- 采用“统一内部工具注册中心”方案，而不是继续扩展现有手写 registry。
- API、SDK、配置读取都纳入统一工具体系。
- 读操作默认直接执行，不需要前端审批。
- 修改、删除、移动、重命名、创建、发起下载、更新配置、触发任务等写操作都必须前端审批。
- 配置明文允许在服务端执行链路内读取，但不能进入前端返回、消息流、SSE 事件和审批详情。

## 当前问题

### 工具注册范围过窄

当前 [apps/api/src/modules/ai/service/ai-chat-tool-registry.service.ts](/Users/bendong/Code/volix/apps/api/src/modules/ai/service/ai-chat-tool-registry.service.ts:1) 只注册了少量 `anime.*` 和 `openlist.*` 工具。

这意味着：

- AI 无法直接访问 `qBittorrent` SDK。
- AI 无法按需读取账号配置。
- AI 无法把“先读配置 -> 再创建 SDK -> 再调用真实能力”串起来。

因此像“看下 qbit 现在还有没下完的任务吗”这类请求，模型即使理解了用户意图，也没有可用工具完成动作。

### 工具执行与前端暴露耦合

当前工具定义既承担“AI 可用能力描述”，又天然会进入前端可见链路。

这样会带来两个问题：

- 不适合把大量内部能力直接原样暴露出来。
- 无法保证敏感参数、敏感返回、内部执行链路不泄漏到前端。

### 配置读取能力缺位

当前配置体系已经存在，核心读取入口在 [apps/api/src/modules/config/service/config.service.ts](/Users/bendong/Code/volix/apps/api/src/modules/config/service/config.service.ts:1)，但 AI 工具体系没有把它包装为可控的内部能力。

因此 SDK 虽然已经实现，配置虽然已经存在，但 AI 无法用这两者完成端到端动作。

## 设计原则

### 统一建模

所有 AI 可调用能力都统一收敛成同一种内部工具定义，不再区分“这是 SDK 方法”还是“这是业务 API”还是“这是配置读取”。

### 三层可见性

同一份工具执行数据要区分三层视图：

- 服务端内部可见：允许包含明文配置和真实内部调用细节。
- 模型可见：允许保留任务完成所需信息，但默认经过脱敏。
- 前端可见：只允许最小必要摘要，严格脱敏。

### 写操作强审批

审批不依赖调用方自觉声明，而是由统一 runtime 根据工具风险等级强制执行。

### 敏感信息默认不出边界

任何密码、Cookie、Token、API Key、Authorization、签名 URL、下载直链中的鉴权参数，都必须在进入消息流、SSE、工具列表和审批摘要之前完成脱敏。

## 总体架构

建议新增统一的 AI 内部工具 Runtime，替代当前单文件 registry 直连执行模式。

### 模块拆分

#### 1. `ai-internal-tool.types.ts`

定义统一工具模型，至少包含：

- 工具名、描述、分组、风险等级
- 是否需要审批
- 输入 schema
- 服务端执行器
- 模型可见摘要生成器
- 前端可见摘要生成器
- 结果脱敏器

#### 2. `ai-internal-tool-registry.service.ts`

负责注册和查询所有内部工具。工具来源统一挂到这里，但允许按域拆分成多个 builtins 文件维护。

#### 3. `ai-internal-tool-executor.service.ts`

负责统一执行流程：

1. 根据工具名查找定义
2. 校验参数
3. 判断读写风险
4. 生成审批摘要
5. 执行真实逻辑
6. 脱敏结果
7. 返回模型可见结果和前端可见结果

#### 4. `ai-internal-tool-sanitizer.service.ts`

负责所有敏感数据脱敏，包括字段级和内容级两种处理。

#### 5. `ai-internal-tool-catalog.service.ts`

负责生成两种不同清单：

- 给模型看的工具清单
- 给前端看的工具清单

两边内容来源相同，但可见字段不同。

#### 6. `ai-internal-tool-builtins/*`

按来源拆分工具注册文件：

- `config tools`
- `qbittorrent tools`
- `openlist tools`
- `115 tools`
- `anime tools`
- `openlist organizer tools`
- 后续补充的 `api tools`

## 工具数据模型

建议工具定义至少包含以下字段：

```ts
interface InternalAiToolDefinition {
  name: string;
  description: string;
  category: 'config' | 'sdk' | 'api' | 'business';
  riskLevel: 'read' | 'write_low' | 'write_high';
  requiresApproval: boolean;
  inputSchema: Record<string, string>;
  hiddenFromFrontend?: boolean;
  execute: (context, input) => Promise<InternalToolExecutionResult>;
  summarizeForModel?: (result) => unknown;
  summarizeForFrontend?: (input, context) => unknown;
  sanitizeResult?: (result) => unknown;
}
```

其中最关键的是把“执行结果”和“展示结果”拆开。

建议执行结果结构如下：

```ts
interface InternalToolExecutionResult {
  internalResult: unknown;
  modelResult?: unknown;
  frontendResult?: unknown;
}
```

如果某个工具没有显式提供 `modelResult` 或 `frontendResult`，则统一走默认脱敏器生成安全结果。

## 三层可见性模型

### 1. 服务端内部可见

这一层允许工具执行器读取和传递：

- `account_qbittorrent`、`account_openlist`、`account_ai` 等配置明文
- 登录态 Cookie
- 实际构造的 SDK 实例
- 内部 API 请求和完整响应

这一层的数据不能直接落到：

- `AiMessageModel`
- SSE 事件流
- 前端工具列表接口
- 审批详情

### 2. 模型可见

模型只需要得到“继续推理所需的业务结果”，不需要拿到敏感凭证。

例如 qBittorrent 查询未完成任务时，模型应看到的是：

- 任务名
- 进度
- 状态
- 下载速度
- 保存目录

而不是：

- qBit 登录账号密码
- SID Cookie
- 真实带鉴权的请求头

### 3. 前端可见

前端拿到的信息需要进一步收缩，仅保留展示和审批所需摘要。

例如“删除 OpenList 文件”审批卡片可展示：

- 工具名
- 风险级别
- 目标路径
- 操作描述

但不能展示：

- 实际登录凭证
- 底层调用了哪些内部工具
- 隐式读取了哪些配置

## 执行流程

统一执行链路建议调整为：

1. 用户发送消息。
2. orchestrator 获取“模型可见工具清单”并构造系统提示词。
3. 模型返回 `reply` 或 `tool_call`。
4. runtime 根据工具名查找内部工具定义。
5. 如果是读操作，直接执行。
6. 如果是写操作，先生成“前端可见审批摘要”，写入待审批状态。
7. 用户在前端确认后，再执行真实工具逻辑。
8. 执行结果进入统一脱敏流程。
9. 仅将脱敏后的结果写入消息记录和事件流。
10. orchestrator 再把脱敏结果作为工具结果提供给模型继续推理。

## 风险分级与审批策略

### 读操作

以下能力统一视为 `read`：

- 查询配置的脱敏视图
- 使用明文配置创建 SDK 后执行查询
- 列目录、查文件、查任务、查会话、查下载状态、查用户信息
- 任何只读业务查询

这类工具：

- 不需要审批
- 允许 AI 自主调用
- 执行结果仍然需要统一脱敏

### 写操作

以下能力统一视为写操作：

- 创建、更新、删除配置
- 创建、删除、修改文件或目录
- 重命名、移动、复制
- 发起下载、暂停、恢复、删除 qBit 任务
- 触发后台任务
- 修改业务实体

这类工具：

- 必须 `requiresApproval = true`
- 不能在未审批状态下直接执行
- 前端只能看到脱敏后的审批摘要

### 审批摘要内容

审批摘要建议最少包含：

- `toolName`
- `description`
- `riskLevel`
- `actionSummary`
- `maskedArguments`

不应包含：

- 明文配置
- 完整 URL 鉴权参数
- Cookie
- Token
- 内部依赖链

## 敏感信息处理

建议把敏感信息处理做成硬规则，不允许各工具自行决定是否脱敏。

### 字段名脱敏

字段名命中以下关键字时，统一脱敏：

- `password`
- `cookie`
- `token`
- `apiKey`
- `authorization`
- `secret`
- `sid`

### 内容特征脱敏

除了字段名，还需要识别以下内容：

- Bearer Token
- 长随机字符串
- 带签名参数的下载链接
- 含 `pwd`、`signature`、`X-Amz-` 等鉴权参数的 URL

### URL 脱敏

对下载链接和签名链接建议采用：

- 模型侧：保留必要域名和路径，裁掉敏感 query
- 前端侧：默认不返回完整签名 URL，只在确实需要直接预览/下载时返回经过评估的安全链接

### 配置读取能力拆分

配置工具建议拆成两类：

#### `resolveConfigForExecution`

只供服务端执行器内部调用，返回明文配置对象，不进入消息流。

#### `readConfigMasked`

给 AI 和前端看的配置查询工具，返回脱敏结果，例如：

- `baseUrl` 原样保留
- `username` 原样保留
- `password` 显示为 `******`

## 工具来源设计

### Config Tools

配置类工具负责两件事：

- 提供服务端内部配置解析能力
- 提供给 AI 可用的配置状态查询能力

建议首批提供：

- `config.list_keys`
- `config.get_masked`
- `config.check_account_status`

其中内部执行器可以直接调用 `resolveConfigForExecution`，但这个能力不作为前端可见工具暴露。

### SDK Tools

SDK 类工具直接承载真实操作能力，是 AI 自动化能力的核心。

#### qBittorrent

建议全量接入现有 SDK 能力：

- `qbit.get_torrent_list`
- `qbit.get_torrent_by_hash`
- `qbit.get_torrents_by_tag`
- `qbit.add_torrents`
- `qbit.pause_torrents`
- `qbit.resume_torrents`
- `qbit.delete_torrents`
- `qbit.recheck_torrents`
- `qbit.reannounce_torrents`

其中：

- 查询类全部归为读操作
- 修改类全部归为写操作并审批

#### OpenList

建议接入：

- 登录后的目录浏览、文件详情查询
- 创建目录
- 重命名
- 移动
- 复制
- 删除

同样遵循读写分流。

#### 115

建议接入：

- 用户信息
- 文件列表
- 文件获取
- 二维码状态
- 图片相关查询能力

### API Tools

不是所有 controller 都适合直接暴露给 AI。API tools 的含义应当是“复用现有 service 能力，包装成 AI 友好的业务工具”，而不是机械把 HTTP 接口逐个转成工具。

判断标准如下：

- 参数应当足够稳定、清晰
- 返回应当是 AI 能理解并能继续推理的数据
- 调用不应依赖复杂 HTTP 上下文
- 敏感链路应当已可控

这意味着 API tools 需要以 service 为主要复用层，而不是直接复用 controller。

## 典型场景

### 场景一：查询 qBit 未完成任务

用户问：“看下 qbit 现在还有没下完的任务吗”

期望链路：

1. AI 选择 `qbit.get_torrent_list`
2. 工具内部解析 qBit 明文配置
3. 创建 qBit SDK
4. 调用 `getTorrentList`
5. 过滤未完成任务
6. 返回脱敏后的业务结果
7. AI 总结给用户

这一流程中：

- 前端看不到账号密码和 Cookie
- 模型看不到登录凭证
- 用户只看到未完成任务列表和状态总结

### 场景二：删除 OpenList 文件

用户说：“把这个目录删掉”

期望链路：

1. AI 选择删除工具
2. runtime 判断为写操作
3. 生成审批摘要并等待前端确认
4. 用户确认后才执行真实删除
5. 执行结果脱敏后进入对话

## 对现有代码的改造

### 需要替换或重构的部分

- [apps/api/src/modules/ai/service/ai-chat-tool-registry.service.ts](/Users/bendong/Code/volix/apps/api/src/modules/ai/service/ai-chat-tool-registry.service.ts:1)
- [apps/api/src/modules/ai/service/ai-chat-orchestrator.service.ts](/Users/bendong/Code/volix/apps/api/src/modules/ai/service/ai-chat-orchestrator.service.ts:1)
- [apps/api/src/modules/ai/prompt/chat-agent.prompt.ts](/Users/bendong/Code/volix/apps/api/src/modules/ai/prompt/chat-agent.prompt.ts:1)

### 需要复用的现有基础

- 配置读取：[apps/api/src/modules/config/service/config.service.ts](/Users/bendong/Code/volix/apps/api/src/modules/config/service/config.service.ts:1)
- qBit SDK：[apps/api/src/sdk/qbittorrent/create-qbittorrent.sdk.ts](/Users/bendong/Code/volix/apps/api/src/sdk/qbittorrent/create-qbittorrent.sdk.ts:1)
- OpenList SDK：[apps/api/src/sdk/openlist/create-openlist.sdk.ts](/Users/bendong/Code/volix/apps/api/src/sdk/openlist/create-openlist.sdk.ts:1)
- 115 SDK：[apps/api/src/sdk/115/create-115.sdk.ts](/Users/bendong/Code/volix/apps/api/src/sdk/115/create-115.sdk.ts:1)

## 实施顺序

建议分阶段推进，降低一次性改造风险。

### 第一阶段：Runtime 骨架

1. 新增统一工具类型、注册中心、执行器、脱敏器、catalog
2. 把现有手写 `anime.*` 和 `openlist.*` 工具迁入新 runtime
3. 保持现有行为不变，先完成架构落位

### 第二阶段：Config 与 qBit 接入

1. 接入配置内部解析与脱敏读取
2. 接入 qBit 全量读写工具
3. 先跑通“查询未完成任务”这类典型读场景

### 第三阶段：OpenList 与 115 接入

1. 接入目录、文件、图片相关读能力
2. 接入写能力并统一审批

### 第四阶段：业务 API 收口

1. 识别适合 AI 使用的业务 service
2. 封装成稳定的 API tools
3. 去掉零散的临时工具实现

### 第五阶段：前端脱敏展示

1. 前端工具列表改为读取前端可见 catalog
2. 审批卡片改为展示脱敏摘要
3. 隐藏内部工具链细节

## 测试范围

至少覆盖以下验证：

1. 读操作工具可以直接执行。
2. 写操作工具在未审批时不能执行。
3. 写操作审批后可以继续执行。
4. 配置明文不会进入消息表、事件流和前端响应。
5. qBit 查询未完成任务可以端到端跑通。
6. OpenList 和 115 的读能力能被 AI 直接使用。
7. 工具列表对模型和前端的输出内容不同且符合预期。
8. 重试、失败和异常场景下不会泄漏敏感信息。

## 范围边界

本轮设计不做以下事情：

- 不把所有 HTTP route 机械自动反射为 AI 工具。
- 不让前端看到完整内部执行链路。
- 不把明文配置直接暴露给模型或前端。
- 不绕过审批执行任何写操作。

## 实施建议

优先把“统一 runtime + 配置解析 + qBit 查询”做通，再逐步迁移其余能力。这样可以尽快验证这套架构是否真的解决当前最直接的问题，同时避免一次性把全部模块同时改坏。

第一阶段完成后，用户提问“qbit 现在还有没下完的任务吗”，AI 应该能够不再回复“做不了”，而是直接执行查询并给出结果。
