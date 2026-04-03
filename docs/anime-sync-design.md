# Volix 番剧同步任务设计文档

## 1. 背景与目标

### 1.1 背景
当前系统已有：
- 用户/角色/权限体系（`AppFeature`）
- qBittorrent 账号配置与 SDK
- OpenList 账号配置与 SDK
- 后端任务模块骨架（`app_task`）

用户希望实现“订阅番剧自动同步”能力：
1. 从 Mikan 订阅动画（RSS）。
2. 定时检测是否更新。
3. 有更新则自动加入 qBittorrent 下载。
4. 下载完成后，使用 OpenList 处理目标目录：
   - 检查当前剧集与重复剧集
   - 保证目标目录对同一集“有且仅有 1 条中文字幕版本”
5. 将 qBittorrent 下载好的剧集复制到 OpenList 目标目录。
6. 成功后清理 qBittorrent 中对应任务与文件。

### 1.2 目标
- 形成可持续运行的“番剧同步模块”（前后端独立功能模块）。
- 在主页提供入口与状态概览。
- 具备幂等、可重试、可观测、可人工干预能力。

### 1.3 非目标（首期）
- 不做复杂转码。
- 不做多语言智能字幕匹配模型。
- 不做分布式多实例并发调度（先单实例安全）。

---

## 2. 功能范围

### 2.1 首期功能（MVP）
- 订阅管理：增删改查、启停。
- 同步任务调度：按订阅周期轮询 RSS。
- 新番集发现：解析 RSS，识别唯一集。
- 自动下载：提交 qBittorrent。
- 完成检测：轮询 qBittorrent 下载状态。
- OpenList 目录去重：同集只保留一条中文字幕文件。
- 复制入库：从下载目录复制到目标目录。
- 清理下载：删除 qBittorrent 任务及数据。
- 任务状态页：可查看每个剧集流水线状态与错误。

### 2.2 后续增强
- 支持多个下载客户端。
- 更智能命名解析（season/episode/group/resolution）。
- 手动“重跑某一步”。
- 更丰富通知（邮件/站内）。

---

## 3. 前端模块设计

## 3.1 路由与入口

### 主页入口
- 在首页新增一个功能卡片：`番剧同步`。
- 仅当用户有对应功能权限（新增 `AppFeature.ANIME_SYNC`）时展示。

### 路由建议
- `/anime-sync`：模块首页（订阅列表 + 运行状态概览）
- `/anime-sync/subscriptions`：订阅管理
- `/anime-sync/subscriptions/add`：新增订阅
- `/anime-sync/subscriptions/edit/:id`：编辑订阅
- `/anime-sync/jobs`：任务列表（按状态过滤）
- `/anime-sync/jobs/:id`：任务详情（流水线步骤、错误日志、操作按钮）

## 3.2 页面结构

### 模块首页
- 统计卡：
  - 启用订阅数
  - 运行中任务数
  - 最近 24h 成功/失败
- 最近任务列表（10 条）
- 快速操作：手动触发全量轮询

### 订阅管理
- 字段：
  - 订阅名称
  - RSS URL
  - 目标目录（OpenList）
  - qBittorrent 分类（可选）
  - 轮询间隔（秒）
  - 启用状态
- 支持：新增、编辑、启停、删除

### 任务列表
- 维度：订阅、剧集标题、状态、更新时间、错误摘要
- 支持筛选：状态、订阅、时间范围
- 支持动作：重试、跳过、终止

---

## 4. 后端模块设计

## 4.1 模块目录建议

```txt
apps/api/src/modules/anime-sync/
  model/
    subscription.model.ts
    episode-job.model.ts
    run-log.model.ts
  service/
    rss.service.ts
    parser.service.ts
    scheduler.service.ts
    pipeline.service.ts
    dedupe.service.ts
    sdk-bridge.service.ts
  controller/
    anime-sync.controller.ts
  anime-sync.route.ts
  types/
    anime-sync.types.ts
  index.ts
```

## 4.2 SDK 桥接（复用现有配置）

### qBittorrent
- 从 `app_config.account_qbittorrent` 获取连接信息。
- 通过 `createQbittorrentSdk` 构建客户端。

### OpenList
- 从 `app_config.account_openlist` 获取连接信息。
- 通过 `createOpenlistSdk` 登录后执行文件操作。

### 配置可用性检查
- 启动任务前统一校验：
  - qB 配置完整
  - OpenList 配置完整
  - 认证成功
- 失败时更新任务状态 `failed` 并写错误日志。

---

## 5. 数据库设计

## 5.1 订阅表 `app_anime_subscription`

字段建议：
- `id` INTEGER PK
- `name` STRING NOT NULL
- `rss_url` STRING NOT NULL
- `target_openlist_path` STRING NOT NULL
- `qbit_category` STRING NULL
- `poll_interval_sec` INTEGER NOT NULL DEFAULT 300
- `enabled` BOOLEAN NOT NULL DEFAULT true
- `last_polled_at` DATE NULL
- `last_success_at` DATE NULL
- `created_at` DATE
- `updated_at` DATE

索引建议：
- `enabled`
- `updated_at`

## 5.2 剧集任务表 `app_anime_episode_job`

字段建议：
- `id` INTEGER PK
- `subscription_id` INTEGER FK
- `episode_key` STRING NOT NULL （唯一）
- `title` STRING NOT NULL
- `magnet` TEXT NOT NULL
- `torrent_url` TEXT NULL
- `qbit_hash` STRING NULL
- `status` STRING NOT NULL
- `retry_count` INTEGER DEFAULT 0
- `last_error` TEXT NULL
- `meta_json` TEXT NULL
- `discovered_at` DATE
- `completed_at` DATE NULL
- `created_at` DATE
- `updated_at` DATE

唯一约束：
- `(subscription_id, episode_key)`

索引建议：
- `status`
- `subscription_id, updated_at`

## 5.3 执行日志表 `app_anime_run_log`

字段建议：
- `id` INTEGER PK
- `job_id` INTEGER FK
- `step` STRING
- `level` STRING (`info/warn/error`)
- `message` TEXT
- `detail_json` TEXT NULL
- `created_at` DATE

---

## 6. 状态机设计（核心）

## 6.1 状态定义
- `discovered`：已发现新集，待入种
- `queued`：已提交到 qB
- `downloading`：下载中
- `downloaded`：下载完成
- `dedup_done`：目标目录去重完成
- `copied`：已复制到目标目录
- `cleaned`：已清理 qB（终态成功）
- `failed`：失败（可重试）
- `skipped`：人工跳过（终态）

## 6.2 状态推进规则
- 仅允许“单步前进”或进入 `failed`。
- `failed` 可重试，重试后回到失败前一步。
- 每次推进必须写日志。

## 6.3 幂等要求
- 同一步骤重复执行不得产生脏副作用。
  - 入种：若已有 `qbit_hash` 且在 qB 中存在，则不重复 add。
  - 复制：若目标已存在同名且大小一致，视为已复制。
  - 清理：qB 任务不存在时视为已清理。

---

## 7. 核心流程（端到端）

## 7.1 定时轮询
1. 调度器每分钟扫描启用订阅。
2. 对到期订阅执行 RSS 拉取。
3. 解析条目并生成候选 episode。
4. 写入新 job（去重后）。

## 7.2 执行管道
1. `discovered -> queued`：向 qB 提交 magnet/torrent。
2. `queued/downloading -> downloaded`：轮询 qB 完成状态。
3. `downloaded -> dedup_done`：OpenList 目标目录去重。
4. `dedup_done -> copied`：将下载文件复制到目标目录。
5. `copied -> cleaned`：删除 qB 任务和本地数据。

## 7.3 去重策略（首期）

同集识别（优先顺序）：
1. 明确集号解析（SxxEyy / 第xx话）
2. 文件名正则抽取
3. 回退：标题归一化哈希

中文字幕筛选：
- 命中关键词：`简中|中字|CHS|GB|简体`

保留规则：
1. 优先中文字幕
2. 再按分辨率（2160 > 1080 > 720）
3. 再按文件大小
4. 再按修改时间

其余候选：
- 首期直接删除（可配置安全模式：先移动到回收目录）

---

## 8. API 设计（首期）

## 8.1 订阅管理
- `GET /api/anime-sync/subscriptions`
- `POST /api/anime-sync/subscriptions`
- `PUT /api/anime-sync/subscriptions/:id`
- `DELETE /api/anime-sync/subscriptions/:id`
- `POST /api/anime-sync/subscriptions/:id/toggle`

## 8.2 任务管理
- `GET /api/anime-sync/jobs`
- `GET /api/anime-sync/jobs/:id`
- `POST /api/anime-sync/jobs/:id/retry`
- `POST /api/anime-sync/jobs/:id/skip`

## 8.3 手动执行
- `POST /api/anime-sync/run`（全局触发）
- `POST /api/anime-sync/subscriptions/:id/run`（单订阅触发）

## 8.4 概览
- `GET /api/anime-sync/overview`

---

## 9. 调度与并发控制

## 9.1 调度方式
- 复用 `node-schedule` 或固定 `setInterval`（建议后者先行，简单稳定）。
- 每分钟 tick，一次最多推进 N 个任务（防止阻塞）。

## 9.2 并发限制
- 订阅级锁：同一订阅同一时刻只跑一个实例。
- Job 级锁：同一个 job 同时只允许一个 worker 处理。

## 9.3 进程重启恢复
- 启动时扫描 `queued/downloading/downloaded/dedup_done/copied` 的任务继续推进。

---

## 10. 错误处理与重试

### 10.1 可重试错误
- 网络错误
- SDK 认证过期
- OpenList 暂时不可用
- qB 暂时不可用

策略：
- 指数退避（1m/5m/15m）
- `retry_count` 超限后保持 `failed`，等待人工处理

### 10.2 不可重试错误
- 订阅 URL 无效
- 目标路径非法
- 权限永久不足

策略：
- 直接 `failed`
- 记录明确错误码与提示

---

## 11. 观测与运维

### 11.1 日志
- 模块日志分类：`animeSync`
- 每步写结构化日志：`subscriptionId/jobId/step/status/cost`

### 11.2 指标（可后续接入）
- 每分钟发现新集数
- 任务成功率
- 平均处理时长
- 失败原因分布

### 11.3 管理动作
- 手动重试失败任务
- 手动跳过任务
- 手动触发订阅轮询

---

## 12. 权限设计

新增功能枚举：
- `AppFeature.ANIME_SYNC = 'animeSync'`

页面与接口权限：
- 订阅配置、手动触发、任务操作：建议管理员可用。
- 普通用户：可只读概览（可选）。

---

## 13. 与当前代码的对接点

### 13.1 需要新增
- 新模块：`modules/anime-sync`
- 新表：`app_anime_subscription`、`app_anime_episode_job`、`app_anime_run_log`
- 新 feature 枚举：`AppFeature.ANIME_SYNC`
- 前端主页入口与模块页面

### 13.2 需要补强现有 SDK
- qB SDK：补 `add torrent` 接口（magnet/torrent URL）
- OpenList SDK：补全分页拉取、按路径批量处理辅助方法

### 13.3 配置复用
- 直接复用 `app_config.account_qbittorrent` 与 `app_config.account_openlist`
- 不新增重复账号配置页

---

## 14. 里程碑计划

## M1（3~5 天）
- 数据表 + 基础 API（订阅 CRUD）
- RSS 拉取与新集发现
- job 入库与状态页基础

## M2（3~5 天）
- qB 入种 + 下载完成检测
- 基础失败重试

## M3（4~6 天）
- OpenList 去重 + 复制
- qB 清理
- 端到端跑通

## M4（2~3 天）
- 前端管理页完善
- 错误日志与重试操作
- 文档补充与验收

---

## 15. 验收标准

1. 新建订阅后可自动发现新集并生成任务。
2. 新集可自动入 qB 下载并被检测到完成。
3. 完成后目标目录同集仅保留一条中文字幕版本。
4. 新集文件可复制到目标目录。
5. qB 中对应任务与文件可被清理。
6. 失败任务可查看错误并手动重试。
7. 系统重启后可继续处理中断任务。

---

## 16. 风险清单与缓解

1. 文件名解析不稳定
- 缓解：分层匹配 + 保守删除策略 + `safe_mode`

2. OpenList 与 qB 路径映射不一致
- 缓解：订阅级配置显式声明 source/target 根路径，启动前校验

3. API 频率与稳定性
- 缓解：轮询限频、并发上限、错误退避

4. 误删风险
- 缓解：首期开 `safe_mode` 默认 true，先移动回收目录

---

## 17. 后续可选扩展

- RSS 解析增强（多源）
- 剧集命名模板与标准化重命名
- Telegram/邮件通知
- 自动整理季目录
- Webhook 触发（替代轮询）

