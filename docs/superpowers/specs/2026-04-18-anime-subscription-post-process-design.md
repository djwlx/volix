# Anime Subscription Post-Process Design

Date: 2026-04-18

## Background

当前自动追番链路在两类场景下存在明显问题：

1. 仅包含合集、全集、Season Pack 的种子经常无法被正确识别，或者被错误地强行当作单集处理。
2. 下载完成后的归档链路仍由追番模块自身负责最终整理，这会让“复制、重命名、目录规整、通知”耦合在一起，不利于处理合集、多文件种子和后续扩展。

本次目标是把自动追番下载后的后处理链路切换为：

`下载完成 -> 复制到目标目录 -> 调用现有 AI 文件整理 -> 整理完成后发邮件`

同时补足合集类种子的识别与放行规则。

## Goals

- 提高合集、全集类种子的识别准确度。
- 允许“已确认是该番，但无法可靠提取单集号”的条目进入下载。
- 下载完成后不再由追番模块自身完成最终整理，而是复用现有 OpenList AI 文件整理能力。
- 邮件通知只在 AI 文件整理成功后发送。
- 保持普通单集场景现有行为基本稳定。

## Non-Goals

- 不重做整套追番匹配策略。
- 不把整个下载目录直接交给 AI 自由决定最终去向。
- 不引入新的复杂表结构或任务编排系统。
- 不在本次中扩展前端配置项或新增复杂 UI。

## Approach Options

### Option 1: Minimal orchestration change

在现有追番链路上补“合集识别 + 后处理编排切换”。

- 匹配阶段新增合集态识别。
- 下载完成后仍由追番模块负责找到源文件并复制到目标目录。
- 复制完成后调用现有 OpenList AI 文件整理能力。
- AI 文件整理成功后再发送邮件。

优点：

- 改动集中，风险最小。
- 能最大化复用现有追番和 OpenList AI 文件整理能力。
- 最适合当前需求。

缺点：

- 需要一层新的后处理编排代码。

### Option 2: AI owns full post-download placement

下载完成后把源目录、目标目录和订阅信息整体交给 AI，直接由 AI 决定复制、重命名和整理。

优点：

- 灵活性高，理论上对复杂合集最强。

缺点：

- 风险大，可预测性弱。
- 不适合作为第一版稳定方案。

### Option 3: Strict keyword-only collection rules

只基于固定关键词做合集识别，并走特定分支。

优点：

- 实现最简单。

缺点：

- 漏判会很多，后续需要不断补规则。

## Selected Design

采用 **Option 1**。

原因：

- 它在行为上最接近当前系统。
- 对合集类种子补充支持的同时，不会把原有单集归档链路整体推翻。
- 复制、AI 整理、邮件通知的职责边界清晰，便于测试和后续维护。

## Design Details

### 1. Match Classification

在 `anime-matcher.service.ts` 中补充一个轻量匹配分类：

- `episode`: 明确识别到番名，且集数可靠。
- `collection`: 明确识别到番名，但标题表现为合集/全集/Season Pack/Fin/Complete 等，或者无法可靠提取单集号。

建议形式：

- 为现有 `AnimeMatchResult` 增加 `matchKind?: 'episode' | 'collection'`
- 或者增加 `isCollectionLike?: boolean`

推荐使用 `matchKind`，因为语义更明确。

合集态识别信号包括：

- 标题中出现合集关键词，例如：`合集`、`全集`、`Season Pack`、`Complete`、`Fin`
- 能匹配到目标番剧名，但集数解析缺失、不稳定或明显不适合单集命名

### 2. Candidate Selection Rules

在订阅检查与下载投递阶段：

- 普通单集仍优先按现有评分和匹配规则处理。
- 对于 `collection` 类型：
  - 只要能够确认番名匹配，就允许进入候选池。
  - 不要求必须存在 `episode`。
  - 在普通单集与合集同时存在时，默认优先普通单集；合集作为补充候选。

这样可以避免合集误伤正常单集下载决策。

### 3. Post-Download Pipeline

下载完成后的新链路分三段：

#### Stage A: Copy to series root

仍由追番模块负责：

- 在 `openlist_download_path` 中定位下载完成后的源文件或源目录。
- 复制到该番剧的最终目标目录下。

行为约束：

- 单集场景：可以继续使用当前目标路径推导能力，把文件先复制到预期目录区域。
- 合集场景：不得强行按 `SxxExx` 命名。应优先保留原文件名或原目录名复制进目标目录，以避免错误归档。

这一阶段只负责“把文件放入正确番剧目录范围内”，不负责宣布最终整理完成。

#### Stage B: Invoke OpenList AI organizer

复制完成后，直接调用现有 OpenList AI 文件整理能力，对该番剧目标目录执行一次整理。

目标：

- 识别合集中的多集文件
- 保守重命名
- 统一目录层级
- 对高风险重复内容继续走现有保守策略

追番模块不再把自己的复制/重命名结果视为最终归档完成状态。

#### Stage C: Send notification email

只有在 Stage B 成功完成后，才发送成功邮件。

邮件语义要与新链路一致：

- 不再表示“追番模块自身整理完成”
- 改为表示“复制完成并完成 AI 文件整理”

如果 AI 文件整理失败：

- 记录日志
- 不发送成功邮件
- 保留失败上下文，便于后续人工排查

### 4. Responsibility Boundaries

本次改动后职责划分为：

- `anime-matcher`: 负责识别和分类单集/合集候选
- `anime-download`: 负责下载、状态同步、后处理调度
- `anime-organizer` 或新的后处理 helper: 负责复制到番剧目录
- `openlist-ai-organizer`: 负责最终目录整理
- `email notification`: 只在最终整理成功后触发

如果编排代码开始变得拥挤，建议新增一个轻量 service，例如：

- `anime-post-process.service.ts`

专门封装：

- copy
- invoke AI organize
- notify

### 5. Data Model Impact

本次只做最小字段扩展，不引入复杂数据结构。

建议：

- 在 `AnimeMatchResult` 中增加 `matchKind`
- 在下载项持久化时，根据现有结构决定是否需要落库；如果已有字段足够承载，则优先不改表

约束：

- `season` / `episode` 在合集场景允许为空
- `target_path` 仍可保留给单集场景使用
- 合集场景允许先复制到番剧目录范围内，再交给 AI 文件整理细化

## Error Handling

- 匹配到合集但番名不可信：不放行下载。
- 下载完成但未找到源文件：记录 `organize_skip` / `organize_error` 类日志，不发成功邮件。
- 复制成功但 AI 文件整理失败：记录错误并停止成功通知。
- SMTP 未配置或邮件发送失败：不影响整理结果，但需要记录 `mail_notify_error`。

## Logging

需要补充或复用这些阶段日志：

- `match_collection_candidate`
- `post_process_copy_start`
- `post_process_copy_success`
- `post_process_ai_organize_start`
- `post_process_ai_organize_success`
- `post_process_ai_organize_error`
- `mail_notify_start`
- `mail_notify_success`
- `mail_notify_error`

日志中应包含：

- `subscriptionId`
- `itemId`
- `torrentName`
- `matchKind`
- `sourcePath`
- `targetPath`
- AI 整理任务或摘要结果

## Testing Strategy

### Match tests

- 普通单集标题仍能正确识别为 `episode`
- 合集标题能识别为同一番剧的 `collection`
- 番名不匹配但带合集关键词的条目不会被误放行

### Post-process tests

- 单集下载完成后：复制成功 -> 调用 AI 文件整理
- 合集下载完成后：保留原名或原目录复制 -> 调用 AI 文件整理
- AI 文件整理失败时，不发送成功邮件

### Notification tests

- AI 文件整理成功后才发送邮件
- SMTP 不可用时记录错误但不影响已完成的整理结果

## Implementation Outline

1. 扩展 `anime-matcher` 的合集识别与分类输出
2. 调整订阅筛选逻辑，允许合集候选进入下载池
3. 将现有下载后整理链路拆成 `copy -> ai organize -> notify`
4. 如有必要，新增轻量 `anime-post-process.service.ts`
5. 更新邮件文案与日志
6. 补齐匹配、后处理、通知测试

## Risks

- 合集关键词过宽可能导致误判，需要保持“必须命中番名”这个前提。
- 调用 AI 文件整理后，完成时延会比原来更长。
- 如果番剧目录过大，AI 文件整理范围需要保持在该订阅目标目录内，避免扩大扫描范围。

## Success Criteria

- 合集类种子在匹配正确番剧时可以稳定进入下载流程。
- 下载完成后不再依赖追番模块自身完成最终整理。
- OpenList AI 文件整理成为下载后的标准整理阶段。
- 成功邮件只在 AI 文件整理完成后发送。
- 普通单集场景无明显回归。
