# 自动追番功能设计文档

## 1. 背景与目标

当前项目已经具备以下基础能力：

- `qBittorrent` 账号配置、联通性测试、SDK 调用能力
- `OpenList` 账号配置、联通性测试、SDK 调用能力
- `AI` 内部服务封装、提示词工具、日志追踪能力
- 前后端完整的账号配置体系

目标是在此基础上实现一个“自动追番”系统。用户在前端创建追番任务后，后端会定时检测 RSS 订阅，分析 OpenList 中已有资源，识别新增番剧条目，并自动将缺失内容投递到 qBittorrent 下载。下载完成后，再将文件按标准目录结构重命名整理到 OpenList 挂载目录中。

需要特别说明的是，番剧名称在 RSS、文件名、OpenList 目录中的表现形式往往并不完全一致。例如：

- `咒术回战`
- `Jujutsu Kaisen`
- `呪術廻戦`
- `咒术回战 死灭回游 前篇`

因此系统不能依赖“字符串完全相等”做匹配，而应当结合规则和 AI 做名称归一、相似度判断、季集识别和资源优选。

最终希望用户只需要：

1. 新建一个追番任务
2. 填写 RSS、番剧名、目标目录等信息
3. 系统自动检测更新、下载、整理

## 2. 范围

### 2.1 本期范围

- 追番任务的增删改查
- RSS 拉取与解析
- OpenList 中番剧目录的扫描
- 已有季/集识别
- RSS 与现有内容的差异比对
- 名称归一与 AI 匹配
- 候选资源优选
- qBittorrent 自动投递下载
- 下载完成后的标准目录整理
- 任务日志与 AI 调用日志追溯

### 2.2 暂不纳入本期

- 多实例分布式调度
- 复杂的合集拆包
- 自动字幕选择策略
- 自动封面/简介抓取
- 用户级通知系统

## 3. 当前实现基础

### 3.1 账号配置

当前账号配置已支持：

- `AI`
- `qBittorrent`
- `OpenList`
- `SMTP`

相关实现：

- 后端账号配置入口：[apps/api/src/modules/user/controller/user.controller.ts](/Users/bendong/Code/volix/apps/api/src/modules/user/controller/user.controller.ts:532)
- 前端配置页面：
  - [apps/web-pc/src/apps/setting/pages/config/config-qbittorrent.tsx](/Users/bendong/Code/volix/apps/web-pc/src/apps/setting/pages/config/config-qbittorrent.tsx:1)
  - [apps/web-pc/src/apps/setting/pages/config/config-openlist.tsx](/Users/bendong/Code/volix/apps/web-pc/src/apps/setting/pages/config/config-openlist.tsx:1)
  - [apps/web-pc/src/apps/setting/pages/config/config-ai.tsx](/Users/bendong/Code/volix/apps/web-pc/src/apps/setting/pages/config/config-ai.tsx:1)

### 3.2 qBittorrent SDK

已具备：

- 登录
- 获取种子列表
- 添加下载
- 暂停、恢复、删除、重检、重新汇报

实现文件：

- [apps/api/src/sdk/qbittorrent/create-qbittorrent.sdk.ts](/Users/bendong/Code/volix/apps/api/src/sdk/qbittorrent/create-qbittorrent.sdk.ts:1)

### 3.3 OpenList SDK

已具备：

- 登录
- 获取当前账号信息
- 文件列表
- 获取文件详情
- 创建目录
- 重命名
- 移动
- 复制
- 删除

实现文件：

- [apps/api/src/sdk/openlist/create-openlist.sdk.ts](/Users/bendong/Code/volix/apps/api/src/sdk/openlist/create-openlist.sdk.ts:1)

### 3.4 AI 内部工具

已具备：

- 内部 AI 配置读取
- OpenAI 兼容调用
- 提示词封装
- 筛选和重命名工具
- AI 日志追踪

实现文件：

- [apps/api/src/modules/ai/service/ai-client.service.ts](/Users/bendong/Code/volix/apps/api/src/modules/ai/service/ai-client.service.ts:1)
- [apps/api/src/modules/ai/service/ai-tool.service.ts](/Users/bendong/Code/volix/apps/api/src/modules/ai/service/ai-tool.service.ts:1)
- [apps/api/src/modules/ai/service/ai-log.service.ts](/Users/bendong/Code/volix/apps/api/src/modules/ai/service/ai-log.service.ts:1)

### 3.5 日志系统

当前已有三类日志：

- 普通日志
- 数据库日志
- 任务日志

实现文件：

- [apps/api/src/utils/logger.ts](/Users/bendong/Code/volix/apps/api/src/utils/logger.ts:1)

自动追番和 AI 追番判断建议统一写入 `task` 日志。

## 4. 用户交互流程

用户使用流程如下：

1. 进入前端“自动追番”页面
2. 创建追番任务
3. 填写任务信息：
   - 番剧名称
   - 别名 / 关键词
   - RSS 链接
   - OpenList 根目录
   - qBittorrent 下载目录
   - 是否启用 AI
   - 检查周期
   - 命名规则
4. 提交到后端保存
5. 后端定时执行检测
6. 检测到更新时自动下发下载
7. 下载完成后自动整理到标准目录
8. 前端可查看任务状态、已识别条目、下载记录、失败原因

## 5. 核心业务流程

### 5.1 创建任务

1. 前端提交追番任务
2. 后端校验参数合法性
3. 保存到数据库
4. 默认状态为 `active`

### 5.2 定时检测

1. 定时任务扫描所有启用任务
2. 拉取 RSS XML
3. 解析 RSS 条目
4. 拉取 OpenList 对应目录结构
5. 识别现有番剧季、集
6. 对 RSS 条目进行名称归一和番剧匹配
7. 对比现有内容，得出缺失集
8. 对同一集的多个候选资源做优选
9. 仅将“最高分辨率 + 中文字幕”的最优候选投递到 qBittorrent

### 5.3 下载后整理

1. 定时检查 qBittorrent 已完成任务
2. 根据任务关联识别对应追番项
3. 将文件移动或重命名到目标目录
4. 标准化路径为：

```text
咒术回战/S01/E01.ext
咒术回战/S01/E02.ext
```

5. 更新数据库状态为 `organized`

## 6. 系统架构

建议新增模块：`anime-subscription`

模块职责划分如下。

### 6.1 anime-subscription 模块

职责：

- 追番任务管理
- 定时扫描入口
- 任务状态流转
- 任务明细查询

建议目录：

```text
apps/api/src/modules/anime-subscription/
  controller/
  service/
  model/
  types/
  anime-subscription.route.ts
```

### 6.2 rss 服务

职责：

- 拉取 RSS 内容
- 解析 XML
- 输出结构化条目

建议能力：

- `fetchRssXml(url)`
- `parseRssItems(xml)`
- `normalizeRssItem(item)`

RSS 重点字段：

- `guid`
- `title`
- `link`
- `description`
- `pubDate`
- `enclosure.url`

### 6.3 anime matcher 服务

职责：

- 从 RSS 标题中提取番剧名
- 识别季/集
- 判断是不是目标番剧，即使名称不完全一致
- 对合集和特殊集做标记
- 识别字幕语言、分辨率、资源质量
- 对同一集多个候选资源做打分

实现策略：

1. 先走规则识别，提取：
   - 可能的中文名
   - 可能的日文名
   - 可能的英文名 / 罗马音名
   - 季数
   - 集数
   - 分辨率
   - 字幕语言
   - 字幕组
2. 将订阅任务的主名称、别名、关键词与 RSS 标题一起送入 AI 做名称归一与匹配判断
3. AI 输出建议包括：
   - `matched`
   - `normalizedSeriesName`
   - `season`
   - `episode`
   - `subtitleLanguage`
   - `resolution`
   - `confidence`
4. 后端对 AI 结果做规则校正，不直接信任自由文本输出

### 6.4 anime library 服务

职责：

- 扫描 OpenList 已有目录
- 识别现有的季/集结构
- 建立“已存在内容索引”

建议能力：

- `scanSeriesTree(rootPath)`
- `detectSeasonsAndEpisodes(entries)`
- `buildExistingEpisodeMap()`

### 6.5 anime download 服务

职责：

- 向 qBittorrent 投递种子任务
- 保存 qbit hash 与订阅项的映射关系
- 轮询已完成任务
- 对候选资源执行优选策略

建议能力：

- `enqueueRssItemDownload(item, subscription)`
- `syncDownloadStatus()`
- `bindQbitHashToSubscriptionItem()`
- `pickBestCandidateForEpisode(candidates)`

### 6.6 anime organizer 服务

职责：

- 下载完成后执行标准化整理
- 按命名规则输出最终目录结构
- 调用 OpenList 做移动与重命名

建议能力：

- `buildTargetPath(series, season, episode, ext)`
- `organizeCompletedItem()`
- `moveOrRenameInOpenList()`

### 6.7 anime ai 服务

职责：

- 番剧标题筛选
- 季集识别
- 标准命名建议
- 可疑资源剔除

直接复用现有 AI 内部服务，不新增单独外部接口。

## 7. 数据模型设计

### 7.1 表：anime_subscription

字段建议：

- `id`
- `name`
- `aliases`
- `rss_url`
- `series_root_path`
- `qbit_save_path`
- `enabled`
- `use_ai`
- `match_keywords`
- `rename_pattern`
- `check_interval_minutes`
- `last_checked_at`
- `last_success_at`
- `status`
- `created_at`
- `updated_at`

说明：

- `name`：番剧展示名称，例如“咒术回战”
- `aliases`：可选别名数组，例如 `["Jujutsu Kaisen", "呪術廻戦"]`
- `series_root_path`：OpenList 中的目标根目录，例如 `/Anime/咒术回战`
- `qbit_save_path`：qBittorrent 下载目录，对应 OpenList 挂载目录下的实际路径
- `rename_pattern`：默认可设为 `{{series}}/S{{season}}/E{{episode}}`

### 7.2 表：anime_subscription_item

字段建议：

- `id`
- `subscription_id`
- `rss_guid`
- `rss_title`
- `detail_url`
- `torrent_url`
- `published_at`
- `season`
- `episode`
- `episode_raw`
- `resolution`
- `subtitle_language`
- `release_group`
- `score`
- `decision_status`
- `qbit_hash`
- `target_path`
- `reason`
- `created_at`
- `updated_at`

状态建议：

- `pending`
- `skipped`
- `queued`
- `downloading`
- `downloaded`
- `organized`
- `failed`

### 7.3 表：anime_subscription_run_log（可选）

如不想完全依赖日志文件，可增加数据库级巡检记录表：

- `id`
- `subscription_id`
- `started_at`
- `finished_at`
- `status`
- `message`
- `fetched_count`
- `queued_count`
- `failed_count`

## 8. 规则与命名设计

### 8.1 标准目录结构

默认结构：

```text
番剧名/S01/E01.ext
番剧名/S01/E02.ext
番剧名/S02/E01.ext
```

可扩展为：

```text
番剧名/S01/E01 - 原始标题.ext
```

### 8.2 特殊内容分类

建议支持：

- `SxxExx`
- `SP`
- `OVA`
- `Movie`
- 合集包

对于无法稳定识别的条目，建议先进入：

```text
番剧名/NeedsReview/
```

## 9. RSS 解析策略

RSS 条目中重点关注：

- `title`：识别番剧信息
- `description`：可提取大小、补充描述
- `enclosure.url`：torrent 下载链接
- `pubDate`：发布时间

处理逻辑：

1. 根据 `guid` 去重
2. 根据 `enclosure.url` 做二次去重
3. 对标题做正则提取：
   - 集数
   - 季数
   - 字幕组
   - 分辨率
   - 字幕语言
4. 与番剧任务名、别名、关键词做第一轮匹配
5. 对于名称不完全相同但疑似同一番剧的条目，调用 AI 做归一判断

### 9.1 名称匹配策略

名称匹配采用“两阶段判定”：

1. 规则匹配
   - 去除分辨率、字幕组、编码信息、合集标记
   - 归一化中英文括号、空格、分隔符
   - 使用主名称、别名、关键词做模糊匹配
2. AI 匹配
   - 将订阅番剧主名称、别名、RSS 标题、描述一起送给 AI
   - AI 判断该资源是否属于目标番剧
   - AI 输出归一后的番剧名称与匹配置信度

只有规则或 AI 任一明确判定为目标番剧时，才进入后续下载流程。

### 9.2 资源优选策略

同一季同一集可能在 RSS 中出现多个候选资源，本系统默认只下载一个“最优资源”。

默认优选规则：

1. 仅优先选择带中文字幕的资源
2. 在中文字幕候选中优先选择最高分辨率
3. 分辨率相同时，优先选择更稳定的编码或更可信字幕组
4. 若没有中文字幕资源，则本期默认不自动下载，进入待复核状态

建议分辨率优先级：

- `2160p`
- `1440p`
- `1080p`
- `720p`
- `480p`
- 其他未知

## 10. OpenList 扫描策略

扫描时按目标根目录递归获取目录：

示例：

```text
/Anime/咒术回战/
  S01/
    E01.mkv
    E02.mkv
  S02/
    E01.mkv
```

后端识别逻辑：

- `S01` 映射为第 1 季
- `E01` 映射为第 1 集
- 若文件名中带原始标题，只取前缀规则部分识别

输出：

- `existingEpisodeMap[season][episode] = true`

## 11. qBittorrent 投递策略

### 11.1 下载方式

优先使用 RSS 中 `enclosure.url` 的 `.torrent` 地址投递。

### 11.2 去重策略

若下列条件任一成立，则不重复投递：

- 数据库中该 `rss_guid` 已存在
- 已有关联的 `qbit_hash`
- 现有 OpenList 中已经有对应集

### 11.3 候选资源筛选策略

在一个缺失集数对应多个 RSS 条目时，先按下列策略筛选：

1. 去掉明显不是目标番剧的条目
2. 去掉 AI 判断为低置信度的条目
3. 去掉无中文字幕的条目
4. 在剩余候选中选择最高分辨率
5. 若仍有多个候选，再按字幕组可信度或发布时间排序

最终只投递一个候选到 qBittorrent。

### 11.4 建议下载参数

- `savepath`：订阅任务配置的下载目录
- `category`：例如 `anime`
- `tags`：例如 `anime,subscription,<subscription-id>`

## 12. AI 使用策略

AI 仅作为内部服务使用，不暴露独立外部接口。

AI 适合介入的环节：

- 番剧名称归一与别名匹配
- 标题中季集识别困难
- 合集条目识别
- 噪音资源过滤
- 标准重命名建议

推荐模式：

1. 先规则识别
2. 再 AI 做名称归一、季集识别、字幕语言识别和资源筛选
3. 最终结果再由后端规则校正

这样可以保证：

- 性能稳定
- 成本可控
- 命名结果一致

## 13. 调度设计

使用当前依赖中的 `node-schedule` 实现单机任务调度。

建议两个定时任务：

### 13.1 RSS 巡检任务

例如每 10 分钟执行一次：

- 扫描全部启用中的订阅
- 拉 RSS
- 比较差异
- 下发下载

### 13.2 下载完成整理任务

例如每 5 分钟执行一次：

- 检查 qBittorrent 下载列表
- 查找已完成且未整理任务
- 执行目录整理

建议对单个订阅和单个下载项加轻量锁，防止重复执行。

## 14. 日志与追溯

所有追番相关流程都写入 `task` 日志。

建议日志字段：

- `subscriptionId`
- `subscriptionName`
- `rssGuid`
- `torrentUrl`
- `qbitHash`
- `targetPath`
- `traceId`
- `stage`

关键日志阶段：

- `rss_fetch_start`
- `rss_fetch_success`
- `rss_fetch_error`
- `rss_parse_result`
- `openlist_scan_result`
- `diff_result`
- `ai_match_start`
- `ai_match_result`
- `qbit_enqueue_success`
- `qbit_enqueue_error`
- `organize_success`
- `organize_error`

AI 相关日志继续复用现有 trace 机制。

## 15. 异常与边界处理

### 15.1 RSS 拉取失败

- 当前任务记录失败
- 不影响其他任务
- 保留上次成功记录

### 15.2 OpenList 目录不存在

- 可自动创建根目录
- 若创建失败则任务标记失败

### 15.3 qBittorrent 登录失败

- 记录错误
- 本轮跳过投递

### 15.4 RSS 标题无法识别

- 进入 AI 判断
- AI 也失败则进入 `NeedsReview`

### 15.5 合集包处理

本期建议：

- 支持识别合集
- 默认不自动拆包
- 可记录为人工复核项

### 15.6 名称不完全一致

这是正常情况，不应视为异常。

系统应该：

- 先做规则归一
- 再做 AI 匹配
- 将匹配结果和置信度写日志

### 15.7 没有中文字幕资源

若某一集只有日文或其他语言资源，而没有中文字幕资源：

- 本期默认不自动下载
- 将条目标记为 `skipped` 或 `needs-review`
- 在日志中记录原因：`no_chinese_subtitle_candidate`

## 16. 前端设计

建议新增独立页面：`自动追番`

页面能力：

- 追番列表
- 创建任务
- 编辑任务
- 启用/停用
- 立即检查
- 查看条目明细
- 查看失败记录

表单字段建议：

- 番剧名称
- 别名
- RSS 地址
- OpenList 根目录
- qBittorrent 下载目录
- 匹配关键词
- 检查频率
- 是否启用 AI
- 资源筛选策略（默认：最高分辨率 + 中文字幕）
- 命名规则

## 17. API 设计

建议新增：

- `GET /anime-subscriptions`
- `POST /anime-subscriptions`
- `PUT /anime-subscriptions/:id`
- `POST /anime-subscriptions/:id/toggle`
- `POST /anime-subscriptions/:id/check-now`
- `GET /anime-subscriptions/:id/items`
- `GET /anime-subscriptions/:id/logs`

## 18. 分阶段实施计划

### 第一阶段

- 新建后端模块和数据库表
- 追番任务 CRUD
- RSS 拉取与解析
- OpenList 目录扫描
- 与 RSS 差异比对
- qBittorrent 自动投递

### 第二阶段

- 下载完成整理
- 标准命名规则
- 前端任务详情页
- 手动立即检查
- 任务日志可视化

### 第三阶段

- AI 季集识别增强
- 合集识别与拆分策略
- 更多命名模板
- 邮件通知

## 19. 建议的实现文件结构

后端建议新增：

```text
apps/api/src/modules/anime-subscription/
  anime-subscription.route.ts
  controller/
    anime-subscription.controller.ts
  model/
    anime-subscription.model.ts
    anime-subscription-item.model.ts
  service/
    anime-subscription.service.ts
    anime-rss.service.ts
    anime-matcher.service.ts
    anime-library.service.ts
    anime-download.service.ts
    anime-organizer.service.ts
    anime-scheduler.service.ts
  types/
    anime-subscription.types.ts
```

前端建议新增：

```text
apps/web-pc/src/apps/anime-subscription/
  index.tsx
  list.tsx
  detail.tsx
  form.tsx
```

迁移文件建议新增：

- `apps/api/migrations/*create-anime-subscription*.cjs`
- `apps/api/migrations/*create-anime-subscription-item*.cjs`

## 20. 总结

这个自动追番系统可以建立在现有能力之上，整体技术风险可控。

最关键的设计点有三个：

1. RSS 与现有库内容的差异检测要稳定
2. qBittorrent 下载与 OpenList 整理之间要有明确映射
3. AI 只做辅助判断，最终路径和命名必须由后端规则兜底

推荐优先实现第一阶段，让系统先具备“能订阅、能检测、能投递”的最小闭环；之后再逐步增强命名、AI、合集等能力。
