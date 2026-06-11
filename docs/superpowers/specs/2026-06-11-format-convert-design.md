# 格式转换设计

## 背景

当前 `volix` 已经具备本地文件上传、用户级 OpenList 账号配置、后台定时任务和缓存目录管理能力，但还没有统一的媒体格式转换工具。

本次需要新增一个面向普通用户的“格式转换”工具，首版聚焦音视频文件转换，同时把架构设计成可扩展形态，后续可以继续接入其他类型的格式转换能力，而不需要推翻现有任务模型。

本次目标要求如下：

- 前端新增独立的“格式转换”工具页。
- 页面分为“本地文件转换”和“云转换”两个模块。
- 本地文件转换支持上传文件、异步转换、完成后手动下载结果。
- 云转换支持浏览 OpenList 文件、选择转换方式、选择输出目录、后台自动下载转换并回传到 OpenList。
- 后端统一维护一套任务状态机、执行队列、缓存目录和恢复逻辑。
- 转换调用系统级 `ffmpeg`，由 Node.js 通过 `spawn`/`execFile` 执行，不通过 shell 拼接命令。
- 临时缓存目录使用 `data/cache/media/format-convert/`。
- Docker 镜像和文档需要显式补充 `ffmpeg` 运行时依赖。
- 关闭程序后重新启动时，需要清理上次未完成或失败任务的临时缓存，并自动重新执行这些任务。
- 云转换默认同一时间只跑 `1` 个任务。
- 所有新增用户可见文案必须接入 i18n。

## 范围

### 首版范围

首版“格式转换”聚焦音视频媒体文件，支持：

- 视频容器转换：`mp4`、`mkv`、`mov`、`webm`
- 音频提取或音频格式转换：`mp3`、`aac`、`wav`
- 预设型参数选择：输出格式、视频编码器、音频编码器、分辨率、视频码率、音频码率、CRF、编码 preset、是否保留音频
- 可选自定义命令参数
- 本地任务结果下载
- 云任务结果上传回 OpenList
- 任务记录、失败原因、自动恢复、手动重试

### 非目标

本次不包含以下能力：

- 批量多选文件同时创建一个合并任务
- 拖拽时间轴裁剪、封面截取、字幕编辑
- 实时转换进度百分比和剩余时间预测
- 自定义任意 shell 命令
- 除 OpenList 之外的云存储接入
- 多节点分布式转码

## 命名与产品形态

### 工具命名

用户可见名称统一为“格式转换”。

代码内部建议统一使用 `format-convert`，而不是 `video-convert`，原因如下：

- 用户入口需要为未来其他格式类型预留空间。
- 当前首版虽然聚焦媒体文件，但不希望路径、模块名和数据表把能力锁死在视频转码。

### 页面结构

前端新增独立工具页，路由建议为：

- `/format-convert`

首页新增工具卡片，设置页不承担主入口职责。

页面分成两个并列模块：

- 本地文件转换
- 云转换

两块页面共享同一套“转换预设与高级参数”表单结构，只在来源与去向选择上不同。

## 总体架构

### 核心原则

前端展示两种模式，后端只维护一个统一任务内核。

统一任务内核负责：

- 任务记录持久化
- 状态流转
- 执行队列
- `ffmpeg` 参数生成
- 本地缓存目录管理
- 启动恢复
- 失败重试

前端模式只决定任务的来源和目标：

- 本地文件转换：来源是上传文件，目标是站内下载结果
- 云转换：来源是 OpenList 文件，目标是 OpenList 目录

### 模块拆分

后端建议拆为以下几类职责：

- 任务模型与查询层
- 参数规范化与预设注册表
- `ffmpeg` 执行器
- 本地文件来源适配器
- OpenList 来源/目标适配器
- 队列与恢复服务
- HTTP 控制器与路由

这样后续如果接入图片、文档或其他存储，只需要替换来源、目标或预设层，而不需要重写任务系统。

## 状态机设计

### 任务状态

统一任务状态枚举如下：

- `pending`：已创建，等待执行
- `downloading`：正在下载源文件
- `download_failed`：下载失败
- `converting`：正在执行 `ffmpeg`
- `convert_failed`：转换失败
- `uploading`：正在上传转换结果
- `upload_failed`：上传失败
- `completed`：已完成

### 两种模式的状态路径

本地文件转换：

- `pending -> converting -> completed`
- 失败时进入 `convert_failed`

云转换：

- `pending -> downloading -> converting -> uploading -> completed`
- 分别可能进入 `download_failed`、`convert_failed`、`upload_failed`

### 状态展示要求

前端必须明确展示用户关心的阶段语义，而不是只展示“运行中/失败”：

- 下载中
- 转换中
- 上传中
- 下载失败
- 转换失败
- 上传失败
- 已完成

本地任务不会进入上传相关状态，但前后端仍共用同一枚举集合。

## 启动恢复与失败重试

### 恢复规则

应用启动后执行一次格式转换恢复流程：

- 查询所有状态为 `downloading`、`converting`、`uploading`、`download_failed`、`convert_failed`、`upload_failed` 的任务
- 删除这些任务对应的本地工作目录
- 将这些任务统一重置为 `pending`
- 清空当前运行阶段字段和本地临时路径字段
- 递增 `attemptCount`
- 启动后台队列，按创建顺序重新执行

之所以把失败状态也纳入启动恢复，是为了满足“关闭程序后下次打开，要把失败或中断任务删掉并重新转换”的要求。

### 重试规则

用户在前端可以对失败任务手动点“重试”。

手动重试时：

- 先删除旧工作目录
- 清空错误信息
- 状态改回 `pending`
- `attemptCount + 1`
- 重新进入统一队列

### 完成任务清理

云任务完成后：

- 上传成功后立刻删除工作目录
- 仅保留数据库任务记录和远端结果路径

本地任务完成后：

- 工作目录中的源文件和中间文件删除
- 最终结果移动到持久化结果目录供用户下载
- 任务记录保留

## 目录与文件设计

### 缓存目录

临时工作目录统一放到：

- `data/cache/media/format-convert/<taskId>/`

每个任务目录包含：

- `source.*`：标准化后的源文件
- `output.*`：转换输出文件
- `ffmpeg.log`：本次转换日志
- `meta.json`：运行时辅助信息，可选

### 本地结果目录

本地转换完成后的可下载结果不应继续放在缓存目录，否则清理缓存会导致结果丢失。

建议新增持久化结果目录：

- `data/upload/format-convert/<taskId>/`

本地任务完成后把最终输出从缓存目录移动到该目录，并通过专用下载接口提供下载。

### 本地结果保留策略

首版需要明确本地完成结果不是临时缓存的一部分。

建议规则如下：

- 本地任务结果默认持久化保留，直到用户手动删除或后续补充自动清理机制
- 任务记录与结果文件一一对应
- 后续如果增加自动清理策略，应基于“完成时间 + 最近下载时间”设计，而不是直接清扫结果目录

这样可以避免用户还没下载时，结果文件被后台误删。

### 命名规则

默认输出文件名：

- 基于源文件去掉扩展名后的主文件名
- 追加 `-converted`
- 使用目标格式对应扩展名

例如：

- `demo.mov -> demo-converted.mp4`

如果用户填写了自定义输出文件名：

- 后端自动清洗非法路径字符
- 自动校正扩展名与目标格式一致

云转换目标如果出现重名：

- 默认不覆盖
- 后端自动追加序号后缀，例如 `demo-converted(1).mp4`

## 数据模型设计

### 任务表

新增独立任务表，建议命名：

- `format_convert_task`

建议字段如下：

- `id`
- `userId`
- `mode`：`local` | `cloud`
- `sourceType`：`upload` | `openlist`
- `sourceDisplayName`
- `sourceMimeType`
- `sourceSize`
- `sourceLocalUploadName`：本地上传原始文件名，仅本地任务使用
- `sourceOpenlistPath`：云任务源路径
- `targetType`：`download` | `openlist`
- `targetOpenlistDir`：云任务输出目录
- `targetFileName`
- `targetFormat`
- `presetId`
- `commandMode`：`preset` | `custom`
- `customArgsText`
- `optionJson`：结构化参数快照
- `status`
- `attemptCount`
- `lastErrorMessage`
- `lastStage`
- `workspaceDir`
- `resultLocalPath`
- `resultOpenlistPath`
- `startedAt`
- `finishedAt`
- `createdAt`
- `updatedAt`

### 参数快照

`optionJson` 统一保存结构化参数，便于任务历史回放和重试复用。建议包含：

- `outputFormat`
- `videoCodec`
- `audioCodec`
- `resolution`
- `videoBitrateKbps`
- `audioBitrateKbps`
- `crf`
- `encodingPreset`
- `keepAudio`
- `extraArgs`

## 转换参数设计

### 预设模式

前端默认使用傻瓜式预设模式，所有高级项都通过下拉或有限输入呈现，不直接要求用户写命令。

建议首版预设下拉：

- 输出格式：`mp4`、`mkv`、`mov`、`webm`、`mp3`、`aac`、`wav`
- 视频编码器：`copy`、`h264`、`h265`、`vp9`、`av1`
- 音频编码器：`copy`、`aac`、`mp3`、`opus`、`pcm_s16le`
- 分辨率：`原始`、`1080p`、`720p`、`480p`
- 视频码率：`原始`、`2M`、`4M`、`8M`
- 音频码率：`原始`、`128k`、`192k`、`320k`
- CRF：`18`、`20`、`23`、`28`
- 编码 preset：`ultrafast`、`fast`、`medium`、`slow`
- 保留音频：`是`、`否`

后端根据这些结构化选项生成 `ffmpeg` 参数数组。

### 自定义命令模式

前端额外提供“自定义命令参数”输入能力，但不是允许任意 shell。

定义如下：

- 用户只填写 `ffmpeg` 参数文本，不填写 `ffmpeg` 可执行文件名
- 用户不能自行提供输入路径和输出路径
- 服务端固定注入输入文件和输出文件
- 服务端把用户参数解析为参数数组后再调用 `spawn`

这样可以满足“高级可定制”，同时避免命令注入和路径覆盖问题。

### 自定义模式约束

自定义模式下需要拒绝以下参数：

- `-i`
- 输出路径位置参数
- `-y`、`-n`
- 会覆盖日志或导致交互阻塞的参数

服务端固定附加：

- 输入路径
- 输出路径
- `-hide_banner`
- `-nostdin`

如果自定义参数非法，任务在创建阶段直接报错，不进入队列。

## 执行器设计

### `ffmpeg` 调用方式

后端统一通过 Node.js 原生 `child_process.spawn` 或 `execFile` 调用系统 `ffmpeg`。

不使用 shell，原因如下：

- 避免命令注入
- 参数数组更容易复用预设模式
- 更容易把 stdout/stderr 写入日志文件

### 成功与失败判定

执行器需要同时检查：

- 子进程退出码
- 输出文件是否存在
- 输出文件大小是否大于 `0`

任一条件不满足，都视为 `convert_failed`。

### `ffprobe` 元数据校验

除了执行 `ffmpeg`，后端还应在关键节点使用 `ffprobe` 做轻量校验：

- 任务创建后探测源文件是否为可识别媒体
- 转换完成后探测输出文件是否包含预期流信息
- 必要时读取时长、分辨率、容器格式等元数据，回填到任务记录或接口响应

这意味着运行时依赖不应只写 `ffmpeg`，还应明确包含随发行版一起提供的 `ffprobe`。

首版不要求把所有元数据都展示到前端，但后端应预留能力，避免后续再引入第二套探测逻辑。

### 日志策略

`ffmpeg` 标准错误输出写入 `ffmpeg.log`。

任务记录中的 `lastErrorMessage` 只保存摘要：

- 优先取最近一条可读错误
- 截断到合理长度

完整错误排查依靠日志文件，日志文件在手动重试或启动恢复前删除。

## 本地转换设计

### 创建流程

本地转换不复用通用 `/file/upload`，而是新增格式转换专用上传创建接口，原因如下：

- 本地源文件只服务于当前任务，不应该长期污染通用上传空间
- 需要直接写入任务工作目录，方便清理
- 需要上传完成后立即创建任务记录

流程如下：

- 前端上传本地文件并提交转换配置
- 后端创建任务记录
- 后端把源文件直接落到 `workspaceDir/source.*`
- 任务状态置为 `pending`
- 进入统一队列

### 完成流程

本地任务完成后：

- 将 `workspaceDir/output.*` 移动到 `data/upload/format-convert/<taskId>/`
- 更新任务 `resultLocalPath`
- 删除工作目录中剩余文件

前端通过专用下载接口下载，不依赖 OpenList。

## 云转换设计

### OpenList 来源

云转换来源由用户的 OpenList 账号配置驱动。

创建云任务前需要：

- 校验当前用户已配置可用 OpenList 账号
- 浏览并选择一个源文件
- 浏览并选择一个目标目录

### OpenList SDK 扩展

当前 SDK 已具备 `list/get/mkdir/move/copy/remove` 能力，但缺少格式转换所需的两类能力：

- 获取可直接下载的远端文件 URL 或下载流
- 上传本地文件到指定目录

本次需要扩展 OpenList SDK，至少补充：

- 文件下载地址解析
- 上传接口封装
- 重名结果处理辅助

### OpenList SDK 完整性要求

当前仓库中的 `apps/api/src/sdk/openlist/create-openlist.sdk.ts` 只覆盖了少量已用接口，主要包括：

- 登录 / 哈希登录 / 登出
- 当前用户信息
- 文件列表 / 文件详情
- 新建目录 / 重命名 / 移动 / 复制 / 删除
- 存储列表
- 分享列表
- 公共设置

这并不是一个“全量 OpenList SDK”。

根据 OpenList 官方 `llms.txt` 公开索引，OpenList 目前至少公开了以下几大类接口：

- `Authentication`
- `User`
- `Admin`
- `File System`
- `Public`
- `Sharing`

其中仅 `File System` 一类就包含目录树、搜索、附加操作、上传、离线下载、压缩包操作等一整组能力。

因此，本次设计需要把 OpenList SDK 的目标从“按当前业务零散封装”升级为“覆盖官方公开接口分组的统一 SDK 层”。

这里的“统一 SDK 层”不是只补请求方法本身，还包括与这些接口对应的完整 TypeScript 类型定义：

- 请求参数类型
- 响应体类型
- 分页结构类型
- 文件系统对象类型
- 管理接口相关实体类型
- 分享、用户、认证相关实体类型

实现完成标准应为：

- 官方公开接口在 SDK 中都有对应方法
- 每个方法都有明确的入参与返回值类型
- 业务层不再手写 OpenList 原始请求体和响应体结构

### OpenList SDK 结构调整

由于当前单文件 SDK 已经接近仓库约束上限，继续在 `create-openlist.sdk.ts` 中堆叠所有接口会很快失控。

本次应同步把 OpenList SDK 拆分为目录式结构，建议如下：

- `apps/api/src/sdk/openlist/core/`
- `apps/api/src/sdk/openlist/auth/`
- `apps/api/src/sdk/openlist/user/`
- `apps/api/src/sdk/openlist/admin/`
- `apps/api/src/sdk/openlist/fs/`
- `apps/api/src/sdk/openlist/public/`
- `apps/api/src/sdk/openlist/share/`

职责划分如下：

- `core`：基础请求器、鉴权头、节流、错误处理
- `auth`：登录、登出、2FA、SSO、WebAuthn
- `user`：当前用户与 SSH key
- `admin`：用户、挂载、驱动、设置、meta、索引等管理接口
- `fs`：文件系统全部接口
- `public`：公开只读接口
- `share`：分享相关接口

### OpenList SDK 接口覆盖范围

本次 SDK 设计目标应覆盖 `llms.txt` 中列出的公开接口分组，而不是只覆盖格式转换首版直接依赖的最小集合。

你已经明确要求“全量补 SDK 方法和类型”，因此这里的实现范围按“全量公开接口封装 + 全量共享类型补齐”执行，不缩水为最小可用集合。

至少要把以下能力纳入 SDK 层：

- `Authentication`：用户登录、哈希登录、LDAP 登录、登出、2FA、SSO、WebAuthn
- `User`：当前用户更新、SSH 公钥增删改查
- `Admin`：用户管理、挂载管理、驱动信息、系统设置、meta、搜索索引
- `File System`：列表、详情、搜索、目录树、附加操作、创建目录、重命名、批量重命名、正则重命名、移动、递归移动、复制、删除、清空空目录、流式上传、表单上传、离线下载、解压、压缩包元信息、压缩包目录
- `Public`：公共设置、离线下载工具、支持的压缩扩展名
- `Sharing`：分享列表、详情、创建、更新、删除、启用、停用

其中格式转换首版直接依赖的优先级最高接口为：

- `File System / List directory contents`
- `File System / Get file or directory info`
- `File System / Search files and directories`
- `File System / Get directory tree`
- `File System / Get additional file operations`
- `File System / Create directory`
- `File System / Move files or directories`
- `File System / Upload file (stream)` 或 `Upload file (form)`
- `Public / Get public settings`

### SDK 与业务的边界

OpenList SDK 层只负责“对 OpenList 官方 API 的稳定封装”，不负责格式转换业务逻辑。

业务层另外实现：

- OpenList 源文件选择与过滤
- 结果重名处理策略
- 路径回填与任务记录更新
- 针对格式转换的上传/下载编排

这样后续其他功能如果也要用 OpenList，就不需要再绕开 SDK 临时写请求。

### 云任务执行流程

统一流程如下：

- `pending`：等待队列
- `downloading`：从 OpenList 拉取源文件到 `workspaceDir/source.*`
- `converting`：执行 `ffmpeg`
- `uploading`：将 `workspaceDir/output.*` 上传到目标目录
- `completed`：记录远端结果路径并删除工作目录

### 上传策略

云任务上传使用“先上传后记录成功”的原则：

- 上传成功后才更新 `resultOpenlistPath`
- 上传失败时保留任务记录，状态置为 `upload_failed`
- 启动恢复或手动重试前删除上次残留工作目录，重新从源文件开始走全流程

## 队列与并发设计

### 并发策略

首版采用单 worker 串行执行：

- 系统总并发默认 `1`
- 因而云转换天然满足“同一时间默认只跑 1 个云任务”

这样做的原因：

- `ffmpeg` 对 CPU、磁盘和内存压力较高
- 启动恢复逻辑更简单
- 本地与云任务不会互相抢占到难以预测的程度

后续如果要开放并发配置，可以在同一队列模型上扩展，不影响任务表结构。

### 调度顺序

建议按以下优先级：

- 先按 `createdAt` 升序
- 同优先级下按 `id` 升序

不区分本地任务和云任务的优先权，避免调度规则过早复杂化。

## API 设计

### 后端路由

新增模块建议前缀：

- `/api/format-convert`

建议接口：

- `POST /api/format-convert/local-task`
  创建本地转换任务并上传源文件
- `POST /api/format-convert/cloud-task`
  创建云转换任务
- `GET /api/format-convert/tasks`
  获取当前用户任务列表
- `POST /api/format-convert/task/:id/retry`
  重试任务
- `GET /api/format-convert/task/:id/result`
  下载本地任务结果
- `GET /api/format-convert/openlist/fs`
  浏览 OpenList 目录与文件
- `GET /api/format-convert/presets`
  获取格式、编码器和下拉选项元数据

首版不要求提供删除任务接口；如果后续需要，可以单独补充。

### 类型共享

需要在 `packages/types` 中新增：

- 任务状态枚举
- 任务列表响应类型
- 本地任务创建参数
- 云任务创建参数
- 转换选项类型
- 预设元数据类型

## 前端设计

### 页面布局

前端新增独立 app：

- `apps/web-pc/src/apps/format-convert/`

建议页面结构：

- 顶部简介与注意事项
- `Tab` 或分段卡片切换“本地文件转换 / 云转换”
- 左侧或上方是创建任务表单
- 下方是任务记录列表

### 本地模块

本地模块表单包含：

- 文件上传
- 输出格式
- 高级参数下拉
- 可选自定义命令模式开关
- 开始转换按钮

任务列表中显示：

- 源文件名
- 输出格式
- 当前状态
- 最近错误
- 创建时间
- 完成时间
- 下载按钮
- 重试按钮

### 云模块

云模块表单包含：

- OpenList 源文件选择器
- OpenList 目标目录选择器
- 输出文件名
- 输出格式
- 高级参数下拉
- 可选自定义命令模式开关
- 开始转换按钮

任务列表中显示：

- 源路径
- 目标目录
- 输出结果路径
- 当前状态
- 最近错误
- 创建时间
- 完成时间
- 重试按钮

### OpenList 选择器

OpenList 选择器需要支持目录浏览。

首版建议：

- 源文件选择器只允许选择文件
- 目标目录选择器只允许选择目录
- 源文件列表按媒体扩展名过滤展示
- 仍允许用户手动输入路径作为兜底

### 国际化

所有新增文案必须写入：

- `packages/i18n/src/locales/zh-CN/translation.json`
- `packages/i18n/src/locales/en-US/translation.json`

包括但不限于：

- 路由标题与描述
- 首页卡片文案
- 表单标签
- 状态标签
- 错误提示
- 空状态文案
- 下载与重试按钮文案

## 安全与校验

### 基本校验

创建任务前统一校验：

- 输出格式是否合法
- 结构化参数是否属于允许值
- 自定义参数是否包含禁止项
- 云任务的源路径必须是文件
- 云任务的目标路径必须是目录
- 用户必须已配置 OpenList 账号后才能使用云转换
- 本地上传源文件大小必须在系统允许范围内
- 本地上传源文件扩展名和探测到的媒体类型必须匹配允许集合

首版建议把允许的本地源扩展名限制在常见媒体容器集合内，例如：

- `mp4`
- `mov`
- `mkv`
- `webm`
- `avi`
- `m4v`
- `mp3`
- `aac`
- `wav`

如果扩展名在允许范围内，但 `ffprobe` 无法识别为有效媒体，也应在创建阶段直接报错。

### 路径安全

所有文件名和目录名都必须经过清洗：

- 不允许 `../`
- 不允许绝对路径
- 不允许空文件名

### 命令安全

自定义命令必须以参数数组方式执行，不允许：

- `&&`
- `|`
- `;`
- shell 重定向

本质上服务端不调用 shell，因此这些字符即使出现也要在校验阶段直接拒绝，避免形成歧义配置。

## Docker 与部署设计

### Dockerfile

Docker 镜像需要安装系统级 `ffmpeg`。

由于当前镜像基于 `node:20-slim`，建议在 Dockerfile 中显式：

- `apt-get update`
- `apt-get install -y ffmpeg`
- 清理 `apt` 缓存

### 本地运行要求

源码运行时要求宿主机可直接执行：

- `ffmpeg -version`
- `ffprobe -version`

如果系统未安装 `ffmpeg` 或 `ffprobe`，接口应返回明确错误，而不是在任务运行中静默失败。

### 文档更新

以下文档需要同步说明：

- `README.md`
- `README.zh-CN.md`
- `docs/docker.md`
- `docs/docker.zh-CN.md`

需要补充：

- 格式转换工具简介
- `ffmpeg` 依赖说明
- `ffprobe` 依赖说明
- 本地运行前安装要求
- Docker 镜像已内置 `ffmpeg` / `ffprobe`
- 临时缓存位于 `data/cache/media/format-convert/`

## 测试设计

### 后端单元测试

需要补充以下测试：

- 预设参数生成测试
- 自定义参数校验测试
- 状态流转测试
- 启动恢复把失败和中断任务重置为 `pending` 的测试
- 工作目录清理测试
- 输出文件名冲突处理测试

### 后端集成测试

使用 mock SDK 和 mock `spawn` 覆盖：

- 本地任务从创建到完成
- 云任务从下载到上传完成
- 下载失败进入 `download_failed`
- 转换失败进入 `convert_failed`
- 上传失败进入 `upload_failed`
- 手动重试成功
- 启动恢复后自动重跑成功

### 前端测试

需要补充：

- 表单状态切换测试
- 任务状态标签渲染测试
- 本地与云模块字段差异测试
- 任务列表按钮可见性测试

## 风险与控制

### `ffmpeg` 参数复杂度

如果预设参数直接散落在控制器中，后续扩展会很快失控。

控制方式：

- 统一放进独立参数构建器和预设注册表

### 本地结果误清理

如果本地结果仍放在缓存目录，恢复或清理时会误删。

控制方式：

- 本地完成结果必须移动到独立持久化目录

### OpenList 上传能力缺口

当前 SDK 未覆盖上传。

控制方式：

- 把 OpenList 下载/上传扩展纳入本次后端设计的明确范围，而不是实现时临时拼接请求

### 失败任务无限重试

用户要求启动后自动重试失败任务，这可能导致某些错误在每次重启时重复出现。

控制方式：

- 保留 `attemptCount`
- 在任务记录中清晰展示错误阶段和错误摘要
- 首版仍遵守“每次启动自动重试”的产品定义，不额外引入复杂熔断策略

## 验收标准

- 首页可以进入“格式转换”工具页
- 本地文件可上传并创建转换任务
- 本地任务完成后可手动下载转换结果
- 云转换可浏览 OpenList 文件并选择输出目录
- 云任务完成后能把结果上传回 OpenList
- 本地与云任务都能展示清晰状态机
- 失败任务可以手动重试
- 程序重启后，失败或中断任务会清理旧缓存并自动重新执行
- 云转换默认同一时间只跑 `1` 个任务
- 所有新增文案已接入 i18n
- Docker 与文档已补充 `ffmpeg` 依赖说明
