# 用户数据目录重构设计

## 背景

当前 `/data` 下同时混放了系统级数据、用户文件、缓存、任务中间态和 RSS 文件数据，主要问题是：

- 顶层目录语义不统一，`upload/`、`cache/`、`log/`、`index.db` 混放。
- 最终结果、缓存和中间态混在一起，后续做清理策略时边界不清。
- 用户级文件没有统一根目录，不利于做按用户隔离、排查、备份和容量统计。
- 业务代码直接依赖旧目录命名，后续继续扩展会放大路径耦合。

本次调整目标是建立稳定的用户数据根目录模型，并明确：

- 什么属于系统级目录
- 什么属于用户最终文件
- 什么属于缓存
- 什么属于任务运行中间态

本次不做旧数据自动迁移，也不保留旧路径兼容逻辑。新版本只写新结构，旧数据由人工处理。

## 目标

### 顶层结构

`/data` 只保留：

```text
/data
  /log
  /index.db
  /users
```

其中：

- `log/`：系统日志
- `index.db`：全局数据库文件
- `users/`：所有用户文件数据根目录

### 用户目录结构

每个用户目录使用稳定目录标识字段 `dirKey`：

```text
/data/users/<dirKey>
  /upload
    /manual
    /cloud
    /format
      /results
      /.tasks
  /115-files
    /original
    /format
    /.tasks
  /rss
    /feed
    /history
    /cache
    /.tasks
```

### 核心语义

- `manual/`：用户主动上传的文件
- `cloud/`：从云端源（如 OpenList / 115 云转换源）下载到本地、归属用户的文件
- `format/results/`：格式转换最终结果文件
- `format/.tasks/`：格式转换运行中间态、临时输出、日志
- `115-files/original/`：115 图片原始本地缓存
- `115-files/format/`：115 图片格式化后的缓存文件
- `115-files/.tasks/`：115 图片处理过程中的临时文件
- `rss/feed/`：RSS 条目 HTML/资源等持久化阅读副本
- `rss/history/`：RSS 用户历史相关持久化文件
- `rss/cache/`：RSS 可重建抓取缓存
- `rss/.tasks/`：RSS 运行过程中的待处理任务文件或临时文件

## 非目标

- 不做旧目录自动迁移
- 不保留旧路径兼容读取
- 不在本次设计中修改数据库业务模型本身
- 不把数据库文件迁入用户目录

## 稳定目录标识

需要为用户增加稳定目录标识字段 `dirKey`，要求：

- 不使用用户名
- 不直接使用展示型字段
- 一旦生成后默认不可变
- 可安全用于文件系统路径

建议约束：

- 小写字母、数字、短横线、下划线
- 长度固定或半固定
- 新建用户时自动生成

## 路径映射

### 现状

当前存在的主要路径：

- `/data/log/`
- `/data/index.db`
- `/data/upload/`
- `/data/upload/format-convert/<taskId>/`
- `/data/cache/media/format-convert/sources/`
- `/data/cache/media/format-convert/<taskId>/`
- `/data/cache/115-file/<scope>/`
- `/data/cache/rss-feed/`
- `/data/cache/rss-feed-response/`
- `/data/cache/rss-feed-archive/`
- `/data/cache/rss-feed-item-html/`
- `/data/cache/rss-resource-proxy/`

### 改后映射

- `/data/upload/*`
  -> `/data/users/<dirKey>/upload/manual/*`

- `/data/upload/format-convert/<taskId>/*`
  -> `/data/users/<dirKey>/upload/format/results/<taskId>/*`

- `/data/cache/media/format-convert/sources/*`
  -> `/data/users/<dirKey>/upload/manual/*`
  或 `/data/users/<dirKey>/upload/cloud/*`

- `/data/cache/media/format-convert/<taskId>/*`
  -> `/data/users/<dirKey>/upload/format/.tasks/<taskId>/*`

- `/data/cache/115-file/<scope>/*`
  -> `/data/users/<dirKey>/115-files/original/*`

- `/data/cache/115-file/<scope>/webp/*`
  -> `/data/users/<dirKey>/115-files/format/*`

- `/data/cache/rss-feed/*`
  -> `/data/users/<dirKey>/rss/feed/*`

- `/data/cache/rss-feed-response/*`
  -> `/data/users/<dirKey>/rss/cache/*`

- `/data/cache/rss-feed-archive/*`
  -> `/data/users/<dirKey>/rss/history/*`

- `/data/cache/rss-feed-item-html/*`
  -> `/data/users/<dirKey>/rss/feed/*`

- `/data/cache/rss-resource-proxy/*`
  -> `/data/users/<dirKey>/rss/cache/*`

## 模块设计

### 1. `PATH` 与目录 helper

需要重构 `apps/api/src/utils/path.ts`，从“固定全局目录常量”变成“系统级路径 + 用户级路径 helper”。

建议拆分为两层：

- 系统级：
  - `PATH.data`
  - `PATH.log`
  - `PATH.database`
  - `PATH.usersRoot`

- 用户级 helper：
  - `getUserRootDir(dirKey)`
  - `getUserUploadDir(dirKey)`
  - `getUserManualUploadDir(dirKey)`
  - `getUserCloudUploadDir(dirKey)`
  - `getUserFormatRootDir(dirKey)`
  - `getUserFormatResultDir(dirKey, taskId?)`
  - `getUserFormatTaskDir(dirKey, taskId)`
  - `getUser115RootDir(dirKey)`
  - `getUser115OriginalDir(dirKey)`
  - `getUser115FormatDir(dirKey)`
  - `getUser115TaskDir(dirKey)`
  - `getUserRssRootDir(dirKey)`
  - `getUserRssFeedDir(dirKey)`
  - `getUserRssHistoryDir(dirKey)`
  - `getUserRssCacheDir(dirKey)`
  - `getUserRssTaskDir(dirKey)`

禁止业务模块继续手动拼 `/data/...` 路径。

### 2. 格式转换

格式转换需要重构为显式区分三类数据：

- 用户上传源文件
- 云端下载源文件
- 最终结果
- 任务运行中间态

建议规则：

- 本地上传源文件：`upload/manual/`
- 云端下载源文件：`upload/cloud/`
- 最终结果：`upload/format/results/<taskId>/`
- 临时输出、日志、工作目录：`upload/format/.tasks/<taskId>/`

这意味着：

- `format-convert-workspace.service.ts` 需要改为基于 `dirKey` 生成路径
- `createLocalFormatConvertTask` 需要决定源文件是进入 `manual/`
- OpenList/115 云转换本地下载源文件需要进入 `cloud/`
- `persistFormatConvertResult` 需要改写到 `results/`
- `cleanupFormatConvertWorkspace` 只清 `.tasks`

### 3. 115 图片缓存

115 图片缓存维持“原始缓存 + 格式化缓存 + 临时文件”的结构：

- `115-files/original/`
- `115-files/format/`
- `115-files/.tasks/`

现有基于 `PATH.cache/115-file/<scope>` 的逻辑，需要改为基于用户 `dirKey` 定位。

注意：

- 启动同步逻辑仍需保留
- DB 中 `localCacheFileName` 相关逻辑仍然有效
- 只是文件系统根目录改变

### 4. RSS

RSS 文件目录按用户完全隔离：

- `rss/feed/`
- `rss/history/`
- `rss/cache/`
- `rss/.tasks/`

需要把现有多个 `rss-*` 目录收敛到上述用户目录中。

建议语义：

- `feed/`：HTML 副本、条目资源文件
- `history/`：需要持久保留的历史文件
- `cache/`：抓取响应缓存、代理缓存等可重建文件
- `.tasks/`：pending 队列、临时文件

## 当前清理策略与重生成策略

### 格式转换

当前策略：

- 队列恢复时清空工作目录并重置任务为 pending
- 手动清理时删除：
  - workspace
  - sourceLocalPath
  - outputLocalPath
  - logLocalPath
  - resultLocalPath
  - uploadPath

当前重生成能力：

- `.tasks` 中间态可重建
- OpenList/115 云下载源文件可重下
- 本地上传源文件不可自动重建
- `results/` 删除后不会自动补，需要重跑任务

改后建议：

- `upload/format/.tasks/` 可自动清理
- `upload/format/results/` 不自动删
- `upload/manual/` 和 `upload/cloud/` 不作为通用缓存自动删

### 115 图片缓存

当前策略：

- 启动时校验 DB 与文件系统一致性
- 删除 DB 不再引用的原始缓存文件
- 删除失去原图关联的格式化缓存文件

当前重生成能力：

- 原始缓存可重下
- 格式化缓存可重建

改后建议：

- `115-files/original/` 和 `115-files/format/` 都按缓存语义处理
- `115-files/.tasks/` 全部可删

### RSS

当前策略：

- 支持清理 `resource-cache` / `history` / `all`
- 支持按 route 清理
- 支持只保留最近 N 条
- 同时清理遗留旧目录

当前重生成能力：

- `cache/` 里的抓取缓存可重建
- `feed/` 内容多数可重建
- `history/` 是否完全可恢复取决于外部源是否仍可抓取

改后建议：

- `rss/cache/` 可清
- `rss/.tasks/` 可清
- `rss/feed/` 与 `rss/history/` 默认不和缓存一起粗暴混删

## 静态服务与下载

现有 `/file` 静态服务直接挂在全局 `PATH.upload` 上。改后需要评估：

- 是否继续暴露整个 `users/*/upload`
- 是否改为只通过受控下载接口提供结果文件
- 是否需要保留静态访问兼容

建议：

- 用户最终文件下载尽量走受控接口
- 降低直接暴露整个用户上传根目录的范围

## 受影响模块

重点影响模块：

- `apps/api/src/utils/path.ts`
- `apps/api/src/utils/dependencies.ts`
- `apps/api/src/utils/sequelize.ts`
- `apps/api/src/middleware/static.ts`
- `apps/api/src/modules/file/*`
- `apps/api/src/modules/format-convert/*`
- `apps/api/src/modules/115/service/picture/*`
- `apps/api/src/modules/rss/service/*`
- 所有直接使用 `PATH.upload` / `PATH.cache*` 的代码

## 实施顺序

建议分阶段实施：

1. 增加用户 `dirKey` 字段及生成逻辑
2. 重构 `path.ts` 与用户路径 helper
3. 改格式转换路径
4. 改 115 图片缓存路径
5. 改 RSS 路径
6. 改静态文件和下载入口
7. 清理旧 helper 和旧目录引用

## 风险

- 现有数据库记录可能保存了旧绝对路径，需要同步更新写入策略
- `/file` 静态挂载改变后可能影响现有下载链接
- RSS 文件目录重构会影响清理逻辑、资源读取逻辑和历史数据访问
- 115 缓存目录改变后，启动同步逻辑需要确保不会误判为空

## 验收标准

- `/data` 顶层只剩 `log/`、`users/`、`index.db`
- 新写入的用户文件都进入 `/data/users/<dirKey>/...`
- 格式转换最终结果和中间态严格分离
- 115 图片缓存严格落在用户目录下
- RSS 文件数据严格落在用户目录下
- 所有清理策略仍符合原有业务语义
- 所有可重建数据在删除后可正常重建
