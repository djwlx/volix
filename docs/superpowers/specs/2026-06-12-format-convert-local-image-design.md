# 本地图片转换设计

## 概述

在「格式转换」中新增一种转换类型：**图片本地转换**。用户在页面左侧上传图片、右侧选择目标图片格式（及质量、可选缩放宽度），后端复用 `sharp` 进行图片格式转换并生成可下载结果。

同时把顶部「请选择转换类型」选择器改造成通用、可扩展的「转换类型注册表」，使后续新增其他转换类型时只需追加一条注册项（必要时新增对应设置表单）。

附带改动：删除转换记录时，批量删除按钮文案显示当前已选数量（如「删除所选 (3)」）。

## 目标

- 新增「图片本地转换」类型：本地上传图片 + sharp 转换 + 下载结果。
- 顶部转换类型选择器通用化为注册表驱动，便于后续扩展。
- 复用现有工作台页面布局（左侧选择列 / 右侧输出列）、`LocalBatchUpload`、`SelectedFileBasket`。
- 复用后端 sharp 运行时配置（`configureSharpRuntime`）与图片处理思路。
- 图片右侧可设置：输出格式（JPEG/PNG/WebP/AVIF）、质量、可选缩放宽度。
- 转换记录批量删除按钮显示已选数量。

## 非目标

- 图片转换不支持云端（OpenList）来源 / 目标，仅本地上传 + 下载。
- 不引入图片预设 / 自定义参数模式（图片只有格式 + 质量 + 可选宽度）。
- 不改变现有视频 / 音频（ffmpeg）转换的行为。
- 不在记录里展示 ffmpeg 日志能力的图片版本（图片任务无命令日志）。

## 架构总览

现状：顶部「请选择转换类型」选择器实际对应 `sourceMode: 'local' | 'cloud'`，两者都走 ffmpeg 媒体转换。

改造后引入两个维度：

- `engine`（转换引擎）：`media`（ffmpeg）/ `image`（sharp）
- `mode`（来源/落点）：`LOCAL`（本地上传 + 下载）/ `CLOUD`（OpenList）

通过前端「转换类型注册表」把这两个维度组合成可选类型：

| 类型 id | 文案 | mode | engine | 来源 | 目标 |
|---|---|---|---|---|---|
| `local-media` | 视频本地转换 | LOCAL | media | 本地上传 | 下载 |
| `cloud-media` | OpenList云视频转换 | CLOUD | media | OpenList | OpenList |
| `local-image` | 图片本地转换（新增） | LOCAL | image | 本地上传 | 下载 |

## 前端设计

### 转换类型注册表

新增 `apps/web-pc/src/apps/format-convert/convert-types.ts`：

```ts
interface ConvertTypeConfig {
  id: string;
  labelKey: string;
  mode: FormatConvertMode;
  engine: FormatConvertEngine;
  sourceKind: 'local-upload' | 'cloud-openlist';
  uploadAccept?: string; // 图片类型为 'image/*'
}
```

导出注册表数组与查询助手（`getConvertType(id)`、`listConvertTypes()`）。`source-mode.ts` 的 `getSourceModeOptions` / `hasSelectedSourceMode` 由此重构或替换。

### ConvertTypeSwitch

将 `source-mode-switch.tsx` 泛化为 `convert-type-switch.tsx`（或保留文件名内部改为注册表驱动），`Select` 的选项来自注册表，`value` 为类型 id。

### ConvertTaskCard 拆分

`convert-task-card.tsx` 当前约 508 行，已超过 500 行的代码文件上限。本次按引擎拆分：

- `ConvertTaskCard`：编排组件。持有当前选中的类型 id，渲染 `ConvertTypeSwitch`，并按 `config.engine` 渲染对应面板。
- `MediaConvertPanel`：抽取现有本地 + 云端媒体逻辑，按 `sourceKind` 参数化（本地上传 / OpenList）。行为与现状保持一致。
- `ImageConvertPanel`：新增。本地上传图片 + 图片设置 + 提交。

两个面板复用同一套 `workbench.module.scss` 栅格、`LocalBatchUpload`、`SelectedFileBasket`。

### ImageConvertPanel 右侧

- 输出格式：JPEG / PNG / WebP / AVIF（默认 WebP）。
- 质量：1–100 数值（默认 82）。
- 缩放宽度：可选，留空表示保持原尺寸。
- 输出文件名：复用现有单文件 / 批量命名逻辑（多文件锁定自动命名）。
- 批量摘要 + 提交按钮。
- 不展示 ffmpeg 命令预览、不展示云端目标。

### 图片设置表单与草稿

新增 `image-options.ts`（图片版的 `preset-options.ts`）：

- `ImageConvertFormDraft { option: FormatConvertImageOption; targetFileName: string }`
- `createImageConvertDraft()`、格式 / 质量选项构建、目标文件名生成（jpeg → `.jpg`）。

新增 `ImageConvertSettingsForm` 组件（格式 / 质量 / 宽度三项）。

### 转换记录

`task-record-list.tsx`：

- 详情区按 `engine` 分支：`image` 渲染图片信息行（格式、尺寸 `宽x高`、大小、质量、缩放宽度），`media` 维持现状。
- 批量删除按钮文案在有选中项时显示数量，使用新 i18n key `formatConvert.record.batchDeleteWithCount`（如「删除所选 (3)」），无选中时回退到原文案。

### 前端服务层

`createLocalFormatConvertTask` 的 payload 增加可选 `engine` 与 `imageOption`（或将 `option` 兼容图片选项）。图片任务通过同一 `/format-convert/local-task` multipart 接口提交。

## 后端设计

### 类型（`packages/types/src/api/format-convert.ts`）

新增：

```ts
enum FormatConvertEngine { MEDIA = 'media', IMAGE = 'image' }

const FORMAT_CONVERT_IMAGE_OUTPUT_FORMATS = ['jpeg', 'png', 'webp', 'avif'];
type FormatConvertImageFormat = (typeof FORMAT_CONVERT_IMAGE_OUTPUT_FORMATS)[number];

interface FormatConvertImageOption {
  outputFormat: FormatConvertImageFormat;
  quality: number; // 1-100
  width?: number;
}

interface FormatConvertImageInfo {
  format: string;
  width: number;
  height: number;
  sizeBytes: number;
}

interface FormatConvertImageSummary {
  outputFormat: FormatConvertImageFormat;
  quality: number;
  width?: number;
}
```

`FormatConvertTaskItem` 与 `CreateFormatConvertTaskRequest` 增加：

- `engine?: FormatConvertEngine`（缺省视为 `media`，向后兼容）
- 图片任务专用可选字段：`imageOption?`、`sourceImageInfo?`、`resultImageInfo?`、`imageSummary?`

媒体相关既有字段（`option` / `sourceMediaInfo` / `resultMediaInfo` / `convertSummary`）保持原类型不变，避免影响大量既有媒体代码。

### 数据模型（`format-convert-task.model.ts`）

新增列 `engine`（`STRING`，默认 `'media'`），并在 `ensureFormatConvertTaskSchema` 中追加与现有 JSON 列迁移一致的 `addColumn` 兼容逻辑。

图片任务复用既有 JSON 列：

- `option_json` ← `imageOption`
- `source_media_info_json` ← `sourceImageInfo`
- `result_media_info_json` ← `resultImageInfo`
- `convert_summary_json` ← `imageSummary`

行映射器（`mapFormatConvertTaskRow`）根据 `engine` 决定把这些 JSON 解析到媒体字段还是图片字段。

### 图片转换服务（新增 `format-convert-image.service.ts`）

- `probeImageFile(filePath)`：用 `sharp(filePath).metadata()` + 文件大小，返回 `FormatConvertImageInfo`。
- `convertImageFile(inputPath, outputPath, option)`：`sharp(input).rotate()`，可选 `resize({ width, withoutEnlargement: true })`，按 `outputFormat` 调用 `.jpeg/.png/.webp/.avif({ quality })` 输出。
- 复用 `configureSharpRuntime`。

### 选项规范化（新增 `format-convert-image-option.service.ts`）

- `normalizeFormatConvertImageOption(option)`：校验 / 收敛格式（白名单）、质量（1–100，默认 82）、宽度（正整数，合理上限，可选）。
- `buildFormatConvertImageSummary(option)`。

### 控制器（`format-convert.controller.ts`）

`createLocalFormatConvertTask` 按 `payload.engine` 分支：

- `image`：跳过 ffmpeg 探测，调用 `probeImageFile` 生成 `sourceImageInfo`，`normalizeFormatConvertImageOption` 规范化，落库时 `engine = image`、`mode = LOCAL`、目标为下载。
- 其他：维持现状（ffmpeg）。

### 任务执行（`format-convert-runner.service.ts`）

`runFormatConvertTask` 顶部按 `task.engine` 分支：

- `image` → `runImageConvertTask(task)`：在工作区内用 sharp 转换，`PENDING → CONVERTING → COMPLETED`，落地结果文件、写 `resultImageInfo`，无 ffmpeg 日志。
- 其他 → 现有 ffmpeg 流程不变。

### 路由

复用现有 `/format-convert/local-task`、`/tasks`、删除等路由，无需新增路由。

## i18n

`zh-CN` 与 `en-US` 同步新增：

- `formatConvert.sourcePicker.localImage`：图片本地转换 / Local image convert
- `formatConvert.image.form.outputFormat` / `quality` / `width`（含 placeholder）
- 图片记录详情行标签（格式 / 尺寸 / 大小 / 质量 / 缩放宽度）
- `formatConvert.record.batchDeleteWithCount`：删除所选 ({{count}}) / Delete selected ({{count}})
- 图片相关错误文案（如不支持的图片格式、图片读取失败）

文案仅描述功能项，不加操作引导。

## 测试

### 前端

- `image-options.test.ts`：草稿创建、质量 / 宽度收敛、文件名生成（jpeg → `.jpg`）。
- 扩展 `task-record-list.test.ts`：图片记录详情分支渲染；批量删除按钮显示数量。
- `convert-types.test.ts`：注册表项与查询助手。

### 后端

- `format-convert-image-option.service.test.ts`：选项规范化与 summary。
- `format-convert-image.service.test.ts`：探测与转换（可对真实小图做格式转换断言或对参数构建做断言）。
- 视情况扩展控制器测试覆盖 `engine = image` 的本地任务创建分支。

## 已敲定的决策

- 顶部「请选择转换类型」改为注册表驱动的通用选择器，新增「图片本地转换」。
- 图片右侧暴露：格式 + 质量 + 可选缩放宽度。
- 图片质量默认 82、默认格式 WebP；JPEG 输出扩展名为 `.jpg`。
- 删除转换记录的计数显示在批量删除按钮上。
- 后端用 `engine` 字段 + 复用既有 JSON 列承载图片数据，不新增图片专用列。
- 拆分超长的 `convert-task-card.tsx` 为 `MediaConvertPanel` / `ImageConvertPanel`。
