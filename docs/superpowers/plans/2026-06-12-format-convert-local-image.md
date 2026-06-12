# Local Image Convert Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在「格式转换」中新增「图片本地转换」类型（本地上传图片 + sharp 转换 + 下载），并把顶部转换类型选择器通用化、批量删除按钮显示已选数量。

**Architecture:** 后端在任务上新增 `engine`（`media`/`image`）判别字段；`image` 走新的 sharp 服务，复用既有本地上传 / 下载 / 删除流程与 JSON 列。前端把顶部「请选择转换类型」改为注册表驱动，并把超长的 `convert-task-card.tsx` 拆为 `MediaConvertPanel` / `ImageConvertPanel`。

**Tech Stack:** TypeScript, Koa, Sequelize, sharp, React, Semi UI, vitest。

---

## File Structure

后端（`apps/api/src/modules/format-convert/`）：
- `service/format-convert-image.service.ts`（新增）：sharp 探测与转换原语。
- `service/format-convert-image-option.service.ts`（新增）：图片选项规范化与 summary。
- `controller/format-convert.controller.ts`（改）：本地任务创建按 engine 分支。
- `service/format-convert-runner.service.ts`（改）：任务执行按 engine 分支，新增 `runImageConvertTask`。
- `model/format-convert-task.model.ts`（改）：新增 `engine` 列 + 迁移。
- `service/format-convert-task-db.service.ts`（改）：写入/映射 engine 与图片字段。
- `types/format-convert.types.ts`（改）：DbPayload 支持 engine 与图片选项。

共享类型（`packages/types/src/api/format-convert.ts`，改）：新增 engine、图片格式/选项/信息/摘要类型与字段。

前端（`apps/web-pc/src/apps/format-convert/`）：
- `convert-types.ts`（新增）：转换类型注册表。
- `image-options.ts`（新增）：图片草稿与选项助手。
- `components/convert-type-switch.tsx`（新增，替代 `source-mode-switch.tsx`）。
- `components/media-convert-panel.tsx`（新增，抽取自 `convert-task-card.tsx`）。
- `components/image-convert-panel.tsx`（新增）。
- `components/image-convert-settings-form.tsx`（新增）。
- `components/convert-task-card.tsx`（改）：精简为编排组件。
- `components/task-record-list.tsx`（改）：图片详情分支 + 批量删除计数。
- `components/index.ts`（改）：导出调整。
- `services/format-convert.ts`（`apps/web-pc/src/services/`，改）：payload 支持 engine/imageOption。

i18n：`packages/i18n/src/locales/{zh-CN,en-US}/translation.json`（改）。

---

## Task 1: 共享类型新增 engine 与图片类型

**Files:**
- Modify: `packages/types/src/api/format-convert.ts`
- Test: `test/api/format-convert-option.service.test.ts`（追加断言）

- [ ] **Step 1: 追加失败测试**

在 `test/api/format-convert-option.service.test.ts` 顶部 import 增加，并在 `describe('format convert shared types', ...)` 内追加用例：

```ts
import {
  FormatConvertEngine,
  FORMAT_CONVERT_IMAGE_OUTPUT_FORMATS,
} from '@volix/types';

it('exposes image engine and image output formats', () => {
  expect(FormatConvertEngine.MEDIA).toBe('media');
  expect(FormatConvertEngine.IMAGE).toBe('image');
  expect(FORMAT_CONVERT_IMAGE_OUTPUT_FORMATS).toEqual(['jpeg', 'png', 'webp', 'avif']);
});
```

- [ ] **Step 2: 运行测试确认失败**

Run: `pnpm vitest run test/api/format-convert-option.service.test.ts`
Expected: FAIL（`FormatConvertEngine` / `FORMAT_CONVERT_IMAGE_OUTPUT_FORMATS` 未导出）

- [ ] **Step 3: 实现类型**

在 `packages/types/src/api/format-convert.ts` 的 `FormatConvertMode` 之后新增：

```ts
export enum FormatConvertEngine {
  MEDIA = 'media',
  IMAGE = 'image',
}

export const FORMAT_CONVERT_IMAGE_OUTPUT_FORMATS = Object.freeze(['jpeg', 'png', 'webp', 'avif']);
export type FormatConvertImageFormat = (typeof FORMAT_CONVERT_IMAGE_OUTPUT_FORMATS)[number];

export interface FormatConvertImageOption {
  outputFormat: FormatConvertImageFormat;
  quality: number;
  width?: number;
}

export interface FormatConvertImageInfo {
  format: string;
  width: number;
  height: number;
  sizeBytes: number;
}

export interface FormatConvertImageSummary {
  outputFormat: FormatConvertImageFormat;
  quality: number;
  width?: number;
}
```

在 `CreateFormatConvertTaskRequest` 中新增可选字段：

```ts
export interface CreateFormatConvertTaskRequest {
  mode: FormatConvertMode;
  commandMode: FormatConvertCommandMode;
  source: FormatConvertSource;
  target: FormatConvertTarget;
  option: FormatConvertOption;
  presetId?: string;
  engine?: FormatConvertEngine;
  imageOption?: FormatConvertImageOption;
}
```

在 `FormatConvertTaskItem` 中新增可选字段（媒体字段保持不变）：

```ts
  engine?: FormatConvertEngine;
  imageOption?: FormatConvertImageOption;
  sourceImageInfo?: FormatConvertImageInfo;
  resultImageInfo?: FormatConvertImageInfo;
  imageSummary?: FormatConvertImageSummary;
```

- [ ] **Step 4: 运行测试确认通过**

Run: `pnpm vitest run test/api/format-convert-option.service.test.ts`
Expected: PASS

- [ ] **Step 5: 提交**

```bash
git add packages/types/src/api/format-convert.ts test/api/format-convert-option.service.test.ts
git commit -m "feat(format-convert): add image engine shared types"
```

---

## Task 2: 图片选项规范化服务

**Files:**
- Create: `apps/api/src/modules/format-convert/service/format-convert-image-option.service.ts`
- Test: `test/api/format-convert-image-option.service.test.ts`

- [ ] **Step 1: 写失败测试**

```ts
import { describe, expect, it } from 'vitest';
import {
  buildFormatConvertImageSummary,
  normalizeFormatConvertImageOption,
} from '../../apps/api/src/modules/format-convert/service/format-convert-image-option.service';

describe('format convert image option', () => {
  it('defaults format to webp and quality to 82', () => {
    const option = normalizeFormatConvertImageOption({} as never);
    expect(option.outputFormat).toBe('webp');
    expect(option.quality).toBe(82);
    expect(option.width).toBeUndefined();
  });

  it('clamps quality into 1-100 and rejects unknown format', () => {
    expect(normalizeFormatConvertImageOption({ outputFormat: 'png', quality: 999 } as never).quality).toBe(100);
    expect(normalizeFormatConvertImageOption({ outputFormat: 'png', quality: 0 } as never).quality).toBe(1);
    expect(() => normalizeFormatConvertImageOption({ outputFormat: 'bmp', quality: 80 } as never)).toThrow();
  });

  it('keeps positive integer width and drops invalid width', () => {
    expect(normalizeFormatConvertImageOption({ outputFormat: 'webp', quality: 80, width: 1280 } as never).width).toBe(
      1280
    );
    expect(
      normalizeFormatConvertImageOption({ outputFormat: 'webp', quality: 80, width: 0 } as never).width
    ).toBeUndefined();
  });

  it('builds summary from option', () => {
    expect(buildFormatConvertImageSummary({ outputFormat: 'avif', quality: 60, width: 800 })).toEqual({
      outputFormat: 'avif',
      quality: 60,
      width: 800,
    });
  });
});
```

- [ ] **Step 2: 运行确认失败**

Run: `pnpm vitest run test/api/format-convert-image-option.service.test.ts`
Expected: FAIL（模块不存在）

- [ ] **Step 3: 实现服务**

```ts
import {
  FORMAT_CONVERT_IMAGE_OUTPUT_FORMATS,
  type FormatConvertImageFormat,
  type FormatConvertImageOption,
  type FormatConvertImageSummary,
} from '@volix/types';

const IMAGE_FORMATS = new Set(FORMAT_CONVERT_IMAGE_OUTPUT_FORMATS);
const DEFAULT_IMAGE_FORMAT: FormatConvertImageFormat = 'webp';
const DEFAULT_IMAGE_QUALITY = 82;
const MIN_IMAGE_WIDTH = 16;
const MAX_IMAGE_WIDTH = 8192;

const clampInteger = (value: number, min: number, max: number) => {
  return Math.min(max, Math.max(min, Math.round(value)));
};

export const normalizeFormatConvertImageOption = (
  option: Partial<FormatConvertImageOption>
): FormatConvertImageOption => {
  const rawFormat = String(option?.outputFormat || DEFAULT_IMAGE_FORMAT).toLowerCase();
  if (option?.outputFormat && !IMAGE_FORMATS.has(rawFormat)) {
    throw new Error('format-convert-image-format-not-supported');
  }
  const outputFormat = (IMAGE_FORMATS.has(rawFormat) ? rawFormat : DEFAULT_IMAGE_FORMAT) as FormatConvertImageFormat;

  const rawQuality = Number(option?.quality);
  const quality = Number.isFinite(rawQuality) ? clampInteger(rawQuality, 1, 100) : DEFAULT_IMAGE_QUALITY;

  const rawWidth = Number(option?.width);
  const width =
    Number.isFinite(rawWidth) && rawWidth > 0 ? clampInteger(rawWidth, MIN_IMAGE_WIDTH, MAX_IMAGE_WIDTH) : undefined;

  return { outputFormat, quality, width };
};

export const buildFormatConvertImageSummary = (option: FormatConvertImageOption): FormatConvertImageSummary => {
  return {
    outputFormat: option.outputFormat,
    quality: option.quality,
    width: option.width,
  };
};
```

- [ ] **Step 4: 运行确认通过**

Run: `pnpm vitest run test/api/format-convert-image-option.service.test.ts`
Expected: PASS

- [ ] **Step 5: 提交**

```bash
git add apps/api/src/modules/format-convert/service/format-convert-image-option.service.ts test/api/format-convert-image-option.service.test.ts
git commit -m "feat(format-convert): add image option normalization service"
```

---

## Task 3: 图片转换原语服务（sharp）

**Files:**
- Create: `apps/api/src/modules/format-convert/service/format-convert-image.service.ts`
- Test: `test/api/format-convert-image.service.test.ts`

- [ ] **Step 1: 写失败测试**

测试用 sharp 现场生成一张小图，转换并探测结果。

```ts
import fs from 'fs';
import os from 'os';
import path from 'path';
import sharp from 'sharp';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  convertImageFile,
  probeImageFile,
} from '../../apps/api/src/modules/format-convert/service/format-convert-image.service';

const tmpDir = path.join(os.tmpdir(), `volix-image-convert-${Date.now()}`);
const sourcePath = path.join(tmpDir, 'source.png');

beforeAll(async () => {
  await fs.promises.mkdir(tmpDir, { recursive: true });
  await sharp({ create: { width: 200, height: 100, channels: 3, background: '#3366cc' } })
    .png()
    .toFile(sourcePath);
});

afterAll(async () => {
  await fs.promises.rm(tmpDir, { recursive: true, force: true });
});

describe('format convert image service', () => {
  it('probes width/height/format/size', async () => {
    const info = await probeImageFile(sourcePath);
    expect(info.width).toBe(200);
    expect(info.height).toBe(100);
    expect(info.format).toBe('png');
    expect(info.sizeBytes).toBeGreaterThan(0);
  });

  it('converts to webp and resizes width', async () => {
    const outputPath = path.join(tmpDir, 'out.webp');
    await convertImageFile(sourcePath, outputPath, { outputFormat: 'webp', quality: 80, width: 100 });
    const info = await probeImageFile(outputPath);
    expect(info.format).toBe('webp');
    expect(info.width).toBe(100);
    expect(info.height).toBe(50);
  });
});
```

- [ ] **Step 2: 运行确认失败**

Run: `pnpm vitest run test/api/format-convert-image.service.test.ts`
Expected: FAIL（模块不存在）

- [ ] **Step 3: 实现服务**

```ts
import fs from 'fs';
import sharp from 'sharp';
import type { FormatConvertImageInfo, FormatConvertImageOption } from '@volix/types';
import { configureSharpRuntime } from '../../../utils/sharp-runtime';

configureSharpRuntime(sharp);

export const probeImageFile = async (filePath: string): Promise<FormatConvertImageInfo> => {
  const [metadata, stat] = await Promise.all([sharp(filePath).metadata(), fs.promises.stat(filePath)]);
  return {
    format: String(metadata.format || ''),
    width: Number(metadata.width || 0),
    height: Number(metadata.height || 0),
    sizeBytes: Number(stat.size || 0),
  };
};

export const convertImageFile = async (
  inputPath: string,
  outputPath: string,
  option: FormatConvertImageOption
) => {
  let transformer = sharp(inputPath).rotate();
  if (option.width) {
    transformer = transformer.resize({ width: option.width, withoutEnlargement: true, fit: 'inside' });
  }
  const quality = option.quality;
  if (option.outputFormat === 'jpeg') {
    transformer = transformer.jpeg({ quality });
  } else if (option.outputFormat === 'png') {
    transformer = transformer.png({ quality });
  } else if (option.outputFormat === 'avif') {
    transformer = transformer.avif({ quality });
  } else {
    transformer = transformer.webp({ quality });
  }
  await transformer.toFile(outputPath);
};

export const resolveImageOutputExtension = (outputFormat: FormatConvertImageOption['outputFormat']) => {
  return outputFormat === 'jpeg' ? 'jpg' : outputFormat;
};
```

- [ ] **Step 4: 运行确认通过**

Run: `pnpm vitest run test/api/format-convert-image.service.test.ts`
Expected: PASS

- [ ] **Step 5: 提交**

```bash
git add apps/api/src/modules/format-convert/service/format-convert-image.service.ts test/api/format-convert-image.service.test.ts
git commit -m "feat(format-convert): add sharp image probe and convert service"
```

---

## Task 4: 数据模型 engine 列 + 行映射

**Files:**
- Modify: `apps/api/src/modules/format-convert/model/format-convert-task.model.ts`
- Modify: `apps/api/src/modules/format-convert/types/format-convert.types.ts`
- Modify: `apps/api/src/modules/format-convert/service/format-convert-task-db.service.ts`

- [ ] **Step 1: 模型新增 engine 列**

在 `format-convert-task.model.ts` 的 `mode` 字段之后新增：

```ts
  engine: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'media',
  },
```

把 `engine` 加入迁移：将 `FORMAT_CONVERT_TASK_JSON_COLUMNS` 旁边新增一段对 `engine` 的兼容迁移（因其默认值非 `{}`，单独处理）：

```ts
export const ensureFormatConvertTaskSchema = async () => {
  await FormatConvertTaskModel.sync();
  const queryInterface = sequelize.getQueryInterface();
  const columns = await queryInterface.describeTable('volix_format_convert_task');

  for (const columnName of FORMAT_CONVERT_TASK_JSON_COLUMNS) {
    if (columns[columnName]) {
      continue;
    }
    await queryInterface.addColumn('volix_format_convert_task', columnName, {
      type: DataTypes.TEXT,
      allowNull: false,
      defaultValue: '{}',
    });
  }

  if (!columns.engine) {
    await queryInterface.addColumn('volix_format_convert_task', 'engine', {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'media',
    });
  }
};
```

- [ ] **Step 2: 实体与 DbPayload 类型**

在 `types/format-convert.types.ts` 的 `FormatConvertTaskEntity` 新增 `engine?: FormatConvertEngine;`（import `FormatConvertEngine`、`FormatConvertImageOption` 等），并扩展 `FormatConvertTaskSnapshot` 与 `CreateFormatConvertTaskDbPayload`：

```ts
export interface FormatConvertTaskSnapshot {
  source: FormatConvertSource;
  target: FormatConvertTarget;
  option: FormatConvertOption;
  sourceMediaInfo?: FormatConvertMediaInfo;
  convertSummary?: FormatConvertSummary;
  resultMediaInfo?: FormatConvertMediaInfo;
}

export interface CreateFormatConvertTaskDbPayload
  extends Omit<CreateFormatConvertTaskRequest, 'option'> {
  userId: string;
  engine?: FormatConvertEngine;
  option: FormatConvertOption | FormatConvertImageOption;
  status?: FormatConvertTaskStatus;
  attemptCount?: number;
  requestUserAgent?: string;
  sourceMediaInfo?: FormatConvertMediaInfo | FormatConvertImageInfo;
  convertSummary?: FormatConvertSummary | FormatConvertImageSummary;
  resultMediaInfo?: FormatConvertMediaInfo | FormatConvertImageInfo;
}
```

- [ ] **Step 3: db service 写入与映射 engine**

在 `format-convert-task-db.service.ts`：`createFormatConvertTask` 的 `FormatConvertTaskModel.create({...})` 增加 `engine: payload.engine || 'media',`。

`mapFormatConvertTaskRow` 末尾根据 engine 填充图片字段（媒体字段保持现有解析不变）：

```ts
  const engine = (row.engine as FormatConvertEngine) || FormatConvertEngine.MEDIA;
  const isImage = engine === FormatConvertEngine.IMAGE;

  return {
    // ...existing fields...
    engine,
    imageOption: isImage ? parseJson(row.option_json, {} as FormatConvertImageOption) : undefined,
    sourceImageInfo: isImage ? parseOptionalJson<FormatConvertImageInfo>(row.source_media_info_json) : undefined,
    resultImageInfo: isImage ? parseOptionalJson<FormatConvertImageInfo>(row.result_media_info_json) : undefined,
    imageSummary: isImage ? parseOptionalJson<FormatConvertImageSummary>(row.convert_summary_json) : undefined,
  };
```

（import `FormatConvertEngine` 及图片类型。）

- [ ] **Step 4: 类型检查**

Run: `pnpm -w tsc -b apps/api packages/types`（或仓库既有的类型检查命令）
Expected: 无错误

- [ ] **Step 5: 提交**

```bash
git add apps/api/src/modules/format-convert/model/format-convert-task.model.ts apps/api/src/modules/format-convert/types/format-convert.types.ts apps/api/src/modules/format-convert/service/format-convert-task-db.service.ts
git commit -m "feat(format-convert): persist engine and map image task fields"
```

---

## Task 5: 控制器按 engine 分支创建本地图片任务

**Files:**
- Modify: `apps/api/src/modules/format-convert/controller/format-convert.controller.ts`

- [ ] **Step 1: 引入图片服务与类型**

在文件顶部 import 增加：

```ts
import { FormatConvertEngine, type FormatConvertImageOption } from '@volix/types';
import { probeImageFile } from '../service/format-convert-image.service';
import {
  buildFormatConvertImageSummary,
  normalizeFormatConvertImageOption,
} from '../service/format-convert-image-option.service';
```

（`FormatConvertEngine` 合并进既有 `@volix/types` import。）

- [ ] **Step 2: createLocalFormatConvertTask 按 engine 分支**

把现有 `createLocalFormatConvertTask` 中「移动上传文件之后」的逻辑改为：先解析 payload，再按 `payload.engine` 分支。图片分支不调用 `probeMediaFile`：

```ts
export const createLocalFormatConvertTask: MyMiddleware = async ctx => {
  const userId = ensureLoginUserId(ctx);
  const file = ctx.request.files?.file as UploadedFileFormData | undefined;
  if (!file) {
    badRequest(t({ id: 'file.notFound', defaultMessage: '文件不存在' }));
  }

  const payload = parseJsonField<
    Omit<CreateFormatConvertTaskRequest, 'mode' | 'source'>
  >(ctx.request.body?.payload || '{}');
  const storedUploadPath = buildStoredUploadPath(file?.originalFilename || 'upload.bin');
  await fs.promises.mkdir(path.dirname(storedUploadPath), { recursive: true });
  await moveUploadedFile(String(file?.filepath || ''), storedUploadPath);

  const source = {
    type: FormatConvertSourceType.UPLOAD,
    fileName: path.basename(file?.originalFilename || 'upload.bin'),
    mimeType: file?.mimetype,
    size: file?.size,
    uploadPath: storedUploadPath,
  } as const;

  if (payload.engine === FormatConvertEngine.IMAGE) {
    const imageOption = normalizeFormatConvertImageOption(
      (payload.imageOption || {}) as FormatConvertImageOption
    );
    const sourceImageInfo = await probeImageFile(storedUploadPath);
    const task = await createFormatConvertTask({
      userId,
      engine: FormatConvertEngine.IMAGE,
      mode: FormatConvertMode.LOCAL,
      commandMode: payload.commandMode,
      target: {
        type: FormatConvertTargetType.DOWNLOAD,
        fileName: payload.target?.fileName,
      },
      source,
      option: imageOption,
      sourceMediaInfo: sourceImageInfo,
      convertSummary: buildFormatConvertImageSummary(imageOption),
    });
    void ensureFormatConvertQueueRunning();
    return { task: toPublicFormatConvertTask(task) };
  }

  const sourceMediaInfo = await probeMediaFile(storedUploadPath);
  const option = normalizeFormatConvertOption({
    commandMode: payload.commandMode,
    presetId: payload.presetId,
    option: payload.option,
  });

  const task = await createFormatConvertTask({
    userId,
    mode: FormatConvertMode.LOCAL,
    commandMode: payload.commandMode,
    presetId: payload.presetId,
    target:
      payload.target?.type === FormatConvertTargetType.OPENLIST
        ? payload.target
        : {
            type: FormatConvertTargetType.DOWNLOAD,
            fileName: payload.target?.fileName,
          },
    source,
    option,
    sourceMediaInfo,
    convertSummary: buildFormatConvertSummary({
      commandMode: payload.commandMode,
      presetId: payload.presetId,
      option,
    }),
  });

  void ensureFormatConvertQueueRunning();
  return { task: toPublicFormatConvertTask(task) };
};
```

注意：`commandMode` 对图片任务无意义，沿用 payload 传入值（前端图片草稿会传 `FormatConvertCommandMode.PRESET` 占位）。

- [ ] **Step 3: 类型检查**

Run: 仓库类型检查命令
Expected: 无错误

- [ ] **Step 4: 提交**

```bash
git add apps/api/src/modules/format-convert/controller/format-convert.controller.ts
git commit -m "feat(format-convert): create local image task via sharp"
```

---

## Task 6: 任务执行按 engine 分支

**Files:**
- Modify: `apps/api/src/modules/format-convert/service/format-convert-runner.service.ts`

- [ ] **Step 1: 引入图片依赖**

import 增加：

```ts
import { FormatConvertEngine, type FormatConvertImageOption } from '@volix/types';
import { convertImageFile, probeImageFile, resolveImageOutputExtension } from './format-convert-image.service';
import { normalizeFormatConvertImageOption } from './format-convert-image-option.service';
```

- [ ] **Step 2: runFormatConvertTask 顶部分支**

在 `runFormatConvertTask` 函数体第一行加入：

```ts
  if (task.engine === FormatConvertEngine.IMAGE) {
    return runImageConvertTask(task, hooks);
  }
```

- [ ] **Step 3: 新增 runImageConvertTask**

在文件末尾追加：

```ts
const buildImageOutputFilename = (task: FormatConvertTaskItem, extension: string) => {
  const preferred = task.target.fileName || task.source.fileName || `task-${task.id}.${extension}`;
  const baseName = preferred.replace(/\.[^.]+$/, '');
  return `${baseName}.${extension}`;
};

export const runImageConvertTask = async (task: FormatConvertTaskItem, hooks?: FormatConvertRunnerHooks) => {
  const option = normalizeFormatConvertImageOption((task.imageOption || {}) as FormatConvertImageOption);
  const extension = resolveImageOutputExtension(option.outputFormat);
  const outputWorkspaceName = `output.${extension}`;
  const outputFilename = buildImageOutputFilename(task, extension);

  await ensureFormatConvertWorkspace(task.id);
  const outputWorkspacePath = getFormatConvertWorkspaceFilePath(task.id, outputWorkspaceName);
  const inputPath = resolveLocalSourcePath(task);

  try {
    hooks?.onStatusChange?.(FormatConvertTaskStatus.CONVERTING);
    await updateFormatConvertTaskStatus(task.id, FormatConvertTaskStatus.CONVERTING, {
      last_stage: FormatConvertTaskStage.CONVERT,
      workspace_dir: getFormatConvertWorkspaceDir(task.id),
      source_local_path: inputPath,
      output_local_path: outputWorkspacePath,
      started_at: new Date(),
    });

    await convertImageFile(inputPath, outputWorkspacePath, option);
    const resultImageInfo = await probeImageFile(outputWorkspacePath);
    const resultLocalPath = await persistFormatConvertResult(task.id, outputWorkspacePath, outputFilename);

    await updateFormatConvertTaskStatus(task.id, FormatConvertTaskStatus.COMPLETED, {
      result_local_path: resultLocalPath,
      result_media_info_json: JSON.stringify(resultImageInfo || {}),
      finished_at: new Date(),
      error_message: '',
    });
    hooks?.onStatusChange?.(FormatConvertTaskStatus.COMPLETED);
  } catch (error) {
    log.error('[format-convert] image task failed', { taskId: task.id, error });
    await updateFormatConvertTaskStatus(task.id, FormatConvertTaskStatus.CONVERT_FAILED, {
      error_message: error instanceof Error ? error.message : String(error),
      finished_at: new Date(),
    });
    throw error;
  }
};
```

（`resolveLocalSourcePath`、`ensureFormatConvertWorkspace` 等均已在本文件作用域内。）

- [ ] **Step 4: 类型检查**

Run: 仓库类型检查命令
Expected: 无错误

- [ ] **Step 5: 提交**

```bash
git add apps/api/src/modules/format-convert/service/format-convert-runner.service.ts
git commit -m "feat(format-convert): run image tasks through sharp pipeline"
```

---

## Task 7: 前端转换类型注册表 + 选择器

**Files:**
- Create: `apps/web-pc/src/apps/format-convert/convert-types.ts`
- Create: `apps/web-pc/src/apps/format-convert/components/convert-type-switch.tsx`
- Modify: `apps/web-pc/src/apps/format-convert/components/index.ts`
- Test: `apps/web-pc/src/apps/format-convert/__tests__/convert-types.test.ts`

- [ ] **Step 1: 写失败测试**

```ts
import { describe, expect, it } from 'vitest';
import { FormatConvertEngine } from '@volix/types';
import { getConvertType, listConvertTypes } from '../convert-types';

describe('convert types registry', () => {
  it('lists three convert types with the image one', () => {
    const ids = listConvertTypes().map(item => item.id);
    expect(ids).toEqual(['local-media', 'cloud-media', 'local-image']);
  });

  it('resolves local-image as image engine + local upload', () => {
    const type = getConvertType('local-image');
    expect(type?.engine).toBe(FormatConvertEngine.IMAGE);
    expect(type?.sourceKind).toBe('local-upload');
    expect(type?.uploadAccept).toBe('image/*');
  });
});
```

- [ ] **Step 2: 运行确认失败**

Run: `pnpm --filter @volix/web-pc vitest run src/apps/format-convert/__tests__/convert-types.test.ts`
Expected: FAIL（模块不存在）

- [ ] **Step 3: 实现注册表**

```ts
import { FormatConvertEngine, FormatConvertMode } from '@volix/types';

export type ConvertSourceKind = 'local-upload' | 'cloud-openlist';

export interface ConvertTypeConfig {
  id: string;
  labelKey: string;
  mode: FormatConvertMode;
  engine: FormatConvertEngine;
  sourceKind: ConvertSourceKind;
  uploadAccept?: string;
}

export const CONVERT_TYPES: ConvertTypeConfig[] = [
  {
    id: 'local-media',
    labelKey: 'formatConvert.sourcePicker.localVideo',
    mode: FormatConvertMode.LOCAL,
    engine: FormatConvertEngine.MEDIA,
    sourceKind: 'local-upload',
    uploadAccept: 'video/*,audio/*',
  },
  {
    id: 'cloud-media',
    labelKey: 'formatConvert.sourcePicker.cloudVideo',
    mode: FormatConvertMode.CLOUD,
    engine: FormatConvertEngine.MEDIA,
    sourceKind: 'cloud-openlist',
  },
  {
    id: 'local-image',
    labelKey: 'formatConvert.sourcePicker.localImage',
    mode: FormatConvertMode.LOCAL,
    engine: FormatConvertEngine.IMAGE,
    sourceKind: 'local-upload',
    uploadAccept: 'image/*',
  },
];

export const listConvertTypes = () => CONVERT_TYPES;
export const getConvertType = (id?: string) => CONVERT_TYPES.find(item => item.id === id);
```

- [ ] **Step 4: 实现 ConvertTypeSwitch**

```tsx
import { Select } from '@douyinfe/semi-ui';
import type { ReactElement } from 'react';
import { useI18n } from '@/i18n';
import { listConvertTypes } from '../convert-types';
import styles from './workbench.module.scss';

interface ConvertTypeSwitchProps {
  disabled?: boolean;
  value: string;
  onChange: (value: string) => void;
}

type ConvertTypeSelectProps = {
  disabled?: boolean;
  onChange: (value?: string) => void;
  optionList: Array<{ label: string; value: string }>;
  placeholder?: string;
  value?: string;
};

const ConvertTypeSelect = Select as unknown as (props: ConvertTypeSelectProps) => ReactElement;

export function ConvertTypeSwitch(props: ConvertTypeSwitchProps) {
  const { disabled, value, onChange } = props;
  const { t } = useI18n();
  const optionList = listConvertTypes().map(item => ({ value: item.id, label: t(item.labelKey) }));

  return (
    <div className={styles.modeSwitch}>
      <ConvertTypeSelect
        disabled={disabled}
        optionList={optionList}
        placeholder={t('formatConvert.sourcePicker.placeholder')}
        value={value || undefined}
        onChange={nextValue => onChange(nextValue || '')}
      />
    </div>
  );
}
```

`components/index.ts`：把 `export * from './source-mode-switch';` 改为 `export * from './convert-type-switch';`（`source-mode-switch.tsx` 在 Task 9 删除）。

- [ ] **Step 5: 运行确认通过 + 提交**

Run: `pnpm --filter @volix/web-pc vitest run src/apps/format-convert/__tests__/convert-types.test.ts`
Expected: PASS

```bash
git add apps/web-pc/src/apps/format-convert/convert-types.ts apps/web-pc/src/apps/format-convert/components/convert-type-switch.tsx apps/web-pc/src/apps/format-convert/components/index.ts apps/web-pc/src/apps/format-convert/__tests__/convert-types.test.ts
git commit -m "feat(format-convert): add convert type registry and switch"
```

---

## Task 8: 图片草稿与设置表单

**Files:**
- Create: `apps/web-pc/src/apps/format-convert/image-options.ts`
- Create: `apps/web-pc/src/apps/format-convert/components/image-convert-settings-form.tsx`
- Test: `apps/web-pc/src/apps/format-convert/__tests__/image-options.test.ts`

- [ ] **Step 1: 写失败测试**

```ts
import { describe, expect, it } from 'vitest';
import {
  buildImageFormatOptions,
  buildImageTargetFileName,
  createImageConvertDraft,
} from '../image-options';

describe('image options', () => {
  it('creates draft defaulting to webp quality 82', () => {
    const draft = createImageConvertDraft();
    expect(draft.option.outputFormat).toBe('webp');
    expect(draft.option.quality).toBe(82);
  });

  it('lists four image formats', () => {
    expect(buildImageFormatOptions().map(item => item.value)).toEqual(['jpeg', 'png', 'webp', 'avif']);
  });

  it('builds target filename with jpg extension for jpeg', () => {
    expect(buildImageTargetFileName('photo.heic', 'jpeg')).toBe('photo.jpg');
    expect(buildImageTargetFileName('photo.heic', 'webp')).toBe('photo.webp');
  });
});
```

- [ ] **Step 2: 运行确认失败**

Run: `pnpm --filter @volix/web-pc vitest run src/apps/format-convert/__tests__/image-options.test.ts`
Expected: FAIL

- [ ] **Step 3: 实现 image-options.ts**

```ts
import { FORMAT_CONVERT_IMAGE_OUTPUT_FORMATS, type FormatConvertImageFormat, type FormatConvertImageOption } from '@volix/types';

export interface ImageConvertFormDraft {
  option: FormatConvertImageOption;
  targetFileName: string;
}

export const createImageConvertDraft = (): ImageConvertFormDraft => ({
  option: { outputFormat: 'webp', quality: 82 },
  targetFileName: '',
});

export const buildImageFormatOptions = () =>
  [...FORMAT_CONVERT_IMAGE_OUTPUT_FORMATS].map(value => ({ label: value.toUpperCase(), value }));

export const resolveImageExtension = (outputFormat: FormatConvertImageFormat) =>
  outputFormat === 'jpeg' ? 'jpg' : outputFormat;

export const buildImageTargetFileName = (sourceName: string, outputFormat: FormatConvertImageFormat) => {
  const baseName = String(sourceName || '').replace(/\.[^.]+$/, '') || 'converted';
  return `${baseName}.${resolveImageExtension(outputFormat)}`;
};

export const updateImageDraftOption = (
  draft: ImageConvertFormDraft,
  patch: Partial<FormatConvertImageOption>
): ImageConvertFormDraft => ({
  ...draft,
  option: { ...draft.option, ...patch },
});
```

- [ ] **Step 4: 实现 ImageConvertSettingsForm**

```tsx
import { InputNumber, Select } from '@douyinfe/semi-ui';
import type { FormatConvertImageFormat } from '@volix/types';
import { useI18n } from '@/i18n';
import { buildImageFormatOptions, updateImageDraftOption, type ImageConvertFormDraft } from '../image-options';
import styles from './workbench.module.scss';

interface ImageConvertSettingsFormProps {
  disableActions?: boolean;
  draft: ImageConvertFormDraft;
  onChange: (draft: ImageConvertFormDraft) => void;
}

const SelectAny = Select as any;
const InputNumberAny = InputNumber as any;

export function ImageConvertSettingsForm(props: ImageConvertSettingsFormProps) {
  const { disableActions, draft, onChange } = props;
  const { t } = useI18n();

  return (
    <>
      <div style={{ width: '100%' }}>
        <div className={styles.sectionLabel}>{t('formatConvert.image.form.outputFormat')}</div>
        <div style={{ marginTop: 10 }}>
          <SelectAny
            value={draft.option.outputFormat}
            style={{ width: '100%' }}
            disabled={disableActions}
            optionList={buildImageFormatOptions() as any}
            onChange={(value: unknown) =>
              onChange(updateImageDraftOption(draft, { outputFormat: String(value || 'webp') as FormatConvertImageFormat }))
            }
          />
        </div>
      </div>

      <div style={{ width: '100%' }}>
        <div className={styles.sectionLabel}>{t('formatConvert.image.form.quality')}</div>
        <div style={{ marginTop: 10 }}>
          <InputNumberAny
            value={draft.option.quality}
            min={1}
            max={100}
            style={{ width: '100%' }}
            disabled={disableActions}
            onChange={(value: unknown) => onChange(updateImageDraftOption(draft, { quality: Number(value || 82) }))}
          />
        </div>
      </div>

      <div style={{ width: '100%' }}>
        <div className={styles.sectionLabel}>{t('formatConvert.image.form.width')}</div>
        <div style={{ marginTop: 10 }}>
          <InputNumberAny
            value={draft.option.width}
            min={16}
            max={8192}
            placeholder={t('formatConvert.image.form.widthPlaceholder')}
            style={{ width: '100%' }}
            disabled={disableActions}
            onChange={(value: unknown) => {
              const next = Number(value);
              onChange(updateImageDraftOption(draft, { width: Number.isFinite(next) && next > 0 ? next : undefined }));
            }}
          />
        </div>
      </div>
    </>
  );
}
```

- [ ] **Step 5: 运行确认通过 + 提交**

Run: `pnpm --filter @volix/web-pc vitest run src/apps/format-convert/__tests__/image-options.test.ts`
Expected: PASS

```bash
git add apps/web-pc/src/apps/format-convert/image-options.ts apps/web-pc/src/apps/format-convert/components/image-convert-settings-form.tsx apps/web-pc/src/apps/format-convert/__tests__/image-options.test.ts
git commit -m "feat(format-convert): add image draft helpers and settings form"
```

---

## Task 9: 拆分 ConvertTaskCard 为 Media / Image 面板

目标：`convert-task-card.tsx` 当前 ~508 行超过 500 行上限，按引擎拆分，并接入注册表。

**Files:**
- Create: `apps/web-pc/src/apps/format-convert/components/media-convert-panel.tsx`
- Create: `apps/web-pc/src/apps/format-convert/components/image-convert-panel.tsx`
- Modify: `apps/web-pc/src/apps/format-convert/components/convert-task-card.tsx`
- Delete: `apps/web-pc/src/apps/format-convert/components/source-mode-switch.tsx`
- Modify: `apps/web-pc/src/apps/format-convert/source-mode.ts`（删除或保留为媒体内部使用）
- Modify: `apps/web-pc/src/apps/format-convert/components/index.ts`

- [ ] **Step 1: 抽取 MediaConvertPanel**

把 `convert-task-card.tsx` 中现有的「媒体本地 + 云端」整段逻辑（state、`handleLocalSubmit`、`handleCloudSubmit`、`localBasketItems`/`cloudBasketItems`、整段 `grid` 渲染、`OpenlistBrowser`）原样迁移到新组件 `MediaConvertPanel`。改动点：

- 组件 props：`{ sourceKind: 'local-upload' | 'cloud-openlist'; onCreated: () => void }`。
- 删除内部的 `sourceMode` state 与 `SourceModeSwitch`；用 `activeSourceMode = sourceKind === 'local-upload' ? 'local' : 'cloud'` 推导。
- 顶部的「来源模式」选择行（`modePickerRow`）从面板里移除（改由编排组件统一渲染类型选择器）。
- `LocalBatchUpload` 增加 `accept` 透传（见 Step 4）。

其余逻辑（命令预览、目标文件名、批量摘要、提交）保持不变。

- [ ] **Step 2: 实现 ImageConvertPanel**

```tsx
import { Button, Card, Input, Notification, Space, Toast, Typography } from '@douyinfe/semi-ui';
import { FormatConvertCommandMode, FormatConvertEngine, FormatConvertTargetType } from '@volix/types';
import { useEffect, useState } from 'react';
import { useI18n } from '@/i18n';
import { createLocalFormatConvertTask } from '@/services/format-convert';
import { getDisplayErrorMessage } from '@/utils/error';
import { getLocalFileSignature, mergeLocalFiles } from '../batch-selection';
import { buildImageTargetFileName, createImageConvertDraft } from '../image-options';
import { attachLocalUploadBeforeUnloadGuard } from './local-upload-before-unload';
import { ImageConvertSettingsForm } from './image-convert-settings-form';
import { LocalBatchUpload } from './local-batch-upload';
import { SelectedFileBasket } from './selected-file-basket';
import styles from './workbench.module.scss';

type LocalUploadStatus = 'pending' | 'uploading' | 'success' | 'error';
interface LocalUploadEntry {
  status: LocalUploadStatus;
  percent: number;
}

const formatLocalFileMeta = (file: File) => {
  const size = file.size >= 1024 * 1024 ? `${(file.size / 1024 / 1024).toFixed(2)} MB` : `${Math.ceil(file.size / 1024)} KB`;
  return `${file.type || 'application/octet-stream'} · ${size}`;
};

interface ImageConvertPanelProps {
  onCreated: () => void;
}

export function ImageConvertPanel(props: ImageConvertPanelProps) {
  const { onCreated } = props;
  const { t } = useI18n();
  const [draft, setDraft] = useState(createImageConvertDraft());
  const [localFiles, setLocalFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [uploadEntries, setUploadEntries] = useState<Record<string, LocalUploadEntry>>({});

  useEffect(() => {
    if (!submitting) {
      return;
    }
    return attachLocalUploadBeforeUnloadGuard();
  }, [submitting]);

  const handleAddLocalFiles = (files: File[]) => {
    setUploadEntries({});
    setLocalFiles(current => mergeLocalFiles(current, files));
  };

  const handleSubmit = async () => {
    if (!localFiles.length) {
      Toast.warning(t('formatConvert.local.fileRequired'));
      return;
    }
    let createdCount = 0;
    let failedCount = 0;
    let firstError: unknown;

    setSubmitting(true);
    setUploadEntries(
      localFiles.reduce<Record<string, LocalUploadEntry>>((acc, file) => {
        acc[getLocalFileSignature(file)] = { status: 'pending', percent: 0 };
        return acc;
      }, {})
    );

    for (const file of localFiles) {
      const signature = getLocalFileSignature(file);
      try {
        setUploadEntries(current => ({ ...current, [signature]: { status: 'uploading', percent: 0 } }));
        await createLocalFormatConvertTask(
          file,
          {
            engine: FormatConvertEngine.IMAGE,
            commandMode: FormatConvertCommandMode.PRESET,
            imageOption: draft.option,
            option: { outputFormat: 'mp4' } as never,
            target: {
              type: FormatConvertTargetType.DOWNLOAD,
              fileName: buildImageTargetFileName(file.name, draft.option.outputFormat),
            },
          },
          {
            onUploadProgress: percent =>
              setUploadEntries(current => {
                const previous = current[signature]?.percent ?? 0;
                return { ...current, [signature]: { status: 'uploading', percent: percent > previous ? percent : previous } };
              }),
          }
        );
        setUploadEntries(current => ({ ...current, [signature]: { status: 'success', percent: 100 } }));
        createdCount += 1;
      } catch (error) {
        setUploadEntries(current => ({ ...current, [signature]: { status: 'error', percent: current[signature]?.percent ?? 0 } }));
        failedCount += 1;
        firstError ||= error;
      }
    }
    setSubmitting(false);

    if (createdCount > 0) {
      Notification.success({
        title: t('formatConvert.upload.completedNotifyTitle'),
        content: t('formatConvert.upload.completedNotifyContent'),
        duration: 6,
      });
      if (failedCount > 0) {
        Toast.warning(t('formatConvert.local.batchCreatePartial', { successCount: createdCount, failureCount: failedCount }));
      }
      onCreated();
      return;
    }
    Toast.error(getDisplayErrorMessage(firstError, t('formatConvert.error.createLocalFailed')));
  };

  const basketItems = localFiles.map(file => {
    const signature = getLocalFileSignature(file);
    const entry = uploadEntries[signature];
    return {
      key: signature,
      primary: file.name,
      secondary: formatLocalFileMeta(file),
      uploadStatus: entry?.status,
      uploadPercent: entry?.percent,
    };
  });

  return (
    <div className={styles.grid}>
      <div className={styles.selectionColumn}>
        <div className={styles.panelShell}>
          <div className={styles.panelHeader}>
            <div className={styles.sectionLabel}>{t('formatConvert.workbench.selectionTitle')}</div>
            <Typography.Title heading={6} style={{ margin: '8px 0 0' }}>
              {t('formatConvert.sourcePicker.localImage')}
            </Typography.Title>
          </div>
          <div className={styles.stack}>
            <LocalBatchUpload accept="image/*" disabled={submitting} onSelectFiles={handleAddLocalFiles} />
            <SelectedFileBasket
              clearDisabled={submitting}
              uploading={submitting}
              items={basketItems}
              onClear={() => {
                setLocalFiles([]);
                setUploadEntries({});
              }}
              onRemove={key => {
                setLocalFiles(current => current.filter(file => getLocalFileSignature(file) !== key));
                setUploadEntries(current => {
                  if (!current[key]) {
                    return current;
                  }
                  const next = { ...current };
                  delete next[key];
                  return next;
                });
              }}
            />
          </div>
        </div>
      </div>

      <div className={styles.actionColumn}>
        <div className={styles.panelShellStrong}>
          <div className={styles.panelHeader}>
            <div className={styles.sectionLabel}>{t('formatConvert.workbench.outputTitle')}</div>
            <Typography.Title heading={6} style={{ margin: '8px 0 0' }}>
              {t('formatConvert.workbench.summaryTitle')}
            </Typography.Title>
          </div>
          <div className={styles.stack}>
            <div className={styles.formSection}>
              <ImageConvertSettingsForm disableActions={submitting} draft={draft} onChange={setDraft} />
            </div>
            <div className={styles.summaryPanel}>
              <div className={styles.summaryItem}>
                <div className={styles.summaryTitle}>{t('formatConvert.workbench.summaryTitle')}</div>
                <div className={styles.summaryValue}>
                  {t('formatConvert.workbench.summaryValue', { count: localFiles.length })}
                </div>
              </div>
              <div className={styles.footerActions}>
                <Button theme="solid" disabled={submitting} loading={submitting} onClick={() => void handleSubmit()}>
                  {t('formatConvert.local.submit')}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
```

注意：`option: { outputFormat: 'mp4' } as never` 仅为满足 `CreateFormatConvertTaskRequest.option` 必填项的占位；后端图片分支不读取它。也可在 Task 10 把 service 的 `option` 改为可选以移除该占位（推荐）。

- [ ] **Step 3: 编排组件 ConvertTaskCard**

```tsx
import { Card, Space, Typography } from '@douyinfe/semi-ui';
import { IconCloudStroked } from '@douyinfe/semi-icons';
import { FormatConvertEngine } from '@volix/types';
import { useState } from 'react';
import { useI18n } from '@/i18n';
import { getConvertType } from '../convert-types';
import { ConvertTypeSwitch } from './convert-type-switch';
import { ImageConvertPanel } from './image-convert-panel';
import { MediaConvertPanel } from './media-convert-panel';
import styles from './workbench.module.scss';

interface ConvertTaskCardProps {
  onCreated: () => void;
}

export function ConvertTaskCard(props: ConvertTaskCardProps) {
  const { onCreated } = props;
  const { t } = useI18n();
  const [typeId, setTypeId] = useState('');
  const config = getConvertType(typeId);

  return (
    <Card className={styles.sectionCard} title={t('route.formatConvert.title')} shadows="hover">
      <Space vertical align="start" style={{ width: '100%' }} spacing={20}>
        <div className={styles.modePickerRow}>
          <div className={styles.modePickerMeta}>
            <div className={styles.sectionLabel}>
              <IconCloudStroked />
              {t('formatConvert.form.sourceMode')}
            </div>
          </div>
          <div className={styles.modePickerControl}>
            <ConvertTypeSwitch value={typeId} onChange={setTypeId} />
          </div>
        </div>

        {config?.engine === FormatConvertEngine.IMAGE ? (
          <ImageConvertPanel onCreated={onCreated} />
        ) : config ? (
          <MediaConvertPanel sourceKind={config.sourceKind} onCreated={onCreated} />
        ) : null}
      </Space>
    </Card>
  );
}
```

- [ ] **Step 4: LocalBatchUpload 支持 accept**

修改 `local-batch-upload.tsx`：props 增加 `accept?: string`，`<Upload accept={accept || 'video/*,audio/*'} .../>`。

- [ ] **Step 5: 清理与导出**

- 删除 `components/source-mode-switch.tsx`。
- `components/index.ts` 增加 `export * from './media-convert-panel';` 与 `export * from './image-convert-panel';`、`export * from './image-convert-settings-form';`。
- `source-mode.ts` 若仅被旧 switch 使用则删除；`MediaConvertPanel` 内不再依赖 `hasSelectedSourceMode`（由 props 决定）。同步处理 `__tests__/source-mode.test.ts`（删除或调整）。

- [ ] **Step 6: 校验 + 提交**

Run: `pnpm --filter @volix/web-pc vitest run src/apps/format-convert` 与前端构建/类型检查
Expected: PASS

```bash
git add apps/web-pc/src/apps/format-convert
git commit -m "refactor(format-convert): split task card into media and image panels"
```

---

## Task 10: 前端服务层支持 engine / imageOption

**Files:**
- Modify: `apps/web-pc/src/services/format-convert.ts`

- [ ] **Step 1: 放宽 payload 类型**

把 `createLocalFormatConvertTask` 的 `payload` 类型改为允许 `option` 可选并带 `engine`/`imageOption`：

```ts
export function createLocalFormatConvertTask(
  file: File,
  payload: Omit<CreateFormatConvertTaskRequest, 'mode' | 'source' | 'option'> & {
    option?: CreateFormatConvertTaskRequest['option'];
  },
  options?: { onUploadProgress?: (percent: number) => void }
) {
```

（`engine`、`imageOption` 已是 `CreateFormatConvertTaskRequest` 的可选字段，无需额外声明。）这样 `ImageConvertPanel` 可去掉 `option: { outputFormat: 'mp4' } as never` 占位，仅传 `imageOption`。

- [ ] **Step 2: 同步 ImageConvertPanel**

把 Task 9 中 `ImageConvertPanel` 的提交 payload 去掉 `option` 占位项：

```ts
await createLocalFormatConvertTask(
  file,
  {
    engine: FormatConvertEngine.IMAGE,
    commandMode: FormatConvertCommandMode.PRESET,
    imageOption: draft.option,
    target: {
      type: FormatConvertTargetType.DOWNLOAD,
      fileName: buildImageTargetFileName(file.name, draft.option.outputFormat),
    },
  },
  { /* onUploadProgress 同前 */ }
);
```

- [ ] **Step 3: 校验 + 提交**

Run: 前端类型检查
Expected: 无错误

```bash
git add apps/web-pc/src/services/format-convert.ts apps/web-pc/src/apps/format-convert/components/image-convert-panel.tsx
git commit -m "feat(format-convert): support image payload in local task service"
```

---

## Task 11: 转换记录 — 图片详情 + 批量删除计数

**Files:**
- Modify: `apps/web-pc/src/apps/format-convert/components/task-record-list.tsx`
- Test: `apps/web-pc/src/apps/format-convert/components/__tests__/task-record-list.test.ts`（追加）

- [ ] **Step 1: 追加失败测试**

新增两条断言（沿用该测试既有的渲染/构建辅助风格）：

- 当 `engine === 'image'` 时详情渲染图片信息行（格式/尺寸/大小/质量），不渲染媒体的视频编码等行。
- 批量删除按钮在选中 2 项时文案为「删除所选 (2)」（即调用 `t('formatConvert.record.batchDeleteWithCount', { count: 2 })`）。

具体断言依据该测试文件现有写法补充（导出的 `buildImageInfoRows` / 计数文案 key）。

- [ ] **Step 2: 运行确认失败**

Run: `pnpm --filter @volix/web-pc vitest run src/apps/format-convert/components/__tests__/task-record-list.test.ts`
Expected: FAIL

- [ ] **Step 3: 实现图片详情行**

在 `task-record-list.tsx` 新增（与 `buildMediaInfoRows` 并列）：

```ts
import { FormatConvertEngine, type FormatConvertImageInfo, type FormatConvertImageSummary } from '@volix/types';

const buildImageInfoRows = (info: FormatConvertImageInfo | undefined, t: (key: string) => string) => [
  { label: t('formatConvert.record.detail.formatName'), value: (info?.format || '').toUpperCase() },
  {
    label: t('formatConvert.record.detail.resolution'),
    value: info?.width && info?.height ? `${info.width}x${info.height}` : '',
  },
  { label: t('formatConvert.record.detail.size'), value: formatBytes(info?.sizeBytes) },
];

const buildImageSummaryRows = (summary: FormatConvertImageSummary | undefined, t: (key: string) => string) => [
  { label: t('formatConvert.form.outputFormat'), value: String(summary?.outputFormat || '').toUpperCase() },
  { label: t('formatConvert.image.form.quality'), value: summary?.quality ? String(summary.quality) : '' },
  { label: t('formatConvert.image.form.width'), value: summary?.width ? String(summary.width) : '' },
];
```

在 `expandedRowRender` 中按 `record.engine` 选择详情数据源：image 用 `buildImageInfoRows(record.sourceImageInfo)` / `buildImageSummaryRows(record.imageSummary)` / `buildImageInfoRows(record.resultImageInfo)`，否则维持媒体三段。

- [ ] **Step 4: 实现批量删除计数文案**

把 header 批量删除按钮文案改为：

```tsx
<Button type="danger" disabled={!selectedRowKeys.length}>
  {selectedRowKeys.length
    ? t('formatConvert.record.batchDeleteWithCount', { count: selectedRowKeys.length })
    : t('formatConvert.record.batchDelete')}
</Button>
```

- [ ] **Step 5: 运行确认通过 + 提交**

Run: `pnpm --filter @volix/web-pc vitest run src/apps/format-convert/components/__tests__/task-record-list.test.ts`
Expected: PASS

```bash
git add apps/web-pc/src/apps/format-convert/components/task-record-list.tsx apps/web-pc/src/apps/format-convert/components/__tests__/task-record-list.test.ts
git commit -m "feat(format-convert): show image detail and selected delete count"
```

---

## Task 12: i18n 文案

**Files:**
- Modify: `packages/i18n/src/locales/zh-CN/translation.json`
- Modify: `packages/i18n/src/locales/en-US/translation.json`

- [ ] **Step 1: zh-CN 新增键**

在 `formatConvert.sourcePicker.cloudVideo` 之后及 `formatConvert.record.batchDelete` 附近新增：

```json
"formatConvert.sourcePicker.localImage": "图片本地转换",
"formatConvert.image.form.outputFormat": "图片格式",
"formatConvert.image.form.quality": "质量",
"formatConvert.image.form.width": "缩放宽度",
"formatConvert.image.form.widthPlaceholder": "留空保持原尺寸",
"formatConvert.record.batchDeleteWithCount": "删除所选 ({{count}})",
"formatConvert.error.imageFormatNotSupported": "不支持的图片格式",
"formatConvert.error.imageReadFailed": "图片读取失败"
```

- [ ] **Step 2: en-US 新增对应键**

```json
"formatConvert.sourcePicker.localImage": "Local image convert",
"formatConvert.image.form.outputFormat": "Image format",
"formatConvert.image.form.quality": "Quality",
"formatConvert.image.form.width": "Resize width",
"formatConvert.image.form.widthPlaceholder": "Leave empty to keep original size",
"formatConvert.record.batchDeleteWithCount": "Delete selected ({{count}})",
"formatConvert.error.imageFormatNotSupported": "Unsupported image format",
"formatConvert.error.imageReadFailed": "Failed to read image"
```

- [ ] **Step 3: 校验 + 提交**

Run: 仓库 i18n 校验/构建（若有 `pnpm --filter @volix/i18n ...` 校验脚本）
Expected: 两个 locale 键集合一致

```bash
git add packages/i18n/src/locales/zh-CN/translation.json packages/i18n/src/locales/en-US/translation.json
git commit -m "feat(format-convert): add i18n for local image convert"
```

---

## Task 13: 端到端联调与回归

**Files:** 无新增（手动 + 既有测试）

- [ ] **Step 1: 全量测试**

Run: `pnpm vitest run`（后端） + `pnpm --filter @volix/web-pc vitest run`（前端）
Expected: 全部 PASS（含既有 format-convert 测试不回归）

- [ ] **Step 2: 手动验证**

- 顶部「请选择转换类型」出现三项；选「图片本地转换」后左侧仅接受图片、右侧显示格式/质量/宽度。
- 上传一张图片、选 WebP/质量/宽度，提交后记录出现并可下载；详情展示图片信息。
- 记录表勾选多条，批量删除按钮显示「删除所选 (N)」，删除成功。
- 既有「视频本地转换」「OpenList云视频转换」行为不变。

- [ ] **Step 3: 提交（如有联调修复）**

```bash
git add -A
git commit -m "test(format-convert): finalize local image convert e2e"
```

---

## Self-Review

- **Spec 覆盖**：注册表(Task7)、引擎判别(Task1/4)、sharp 服务(Task2/3)、控制器/runner 分支(Task5/6)、面板拆分(Task9)、服务层(Task10)、记录详情+计数(Task11)、i18n(Task12) 均有对应任务。
- **占位**：无 TBD；占位 `option` 已在 Task10 移除。
- **类型一致**：`FormatConvertEngine`、`FormatConvertImageOption`、`probeImageFile/convertImageFile/resolveImageOutputExtension`、`normalizeFormatConvertImageOption/buildFormatConvertImageSummary`、`createImageConvertDraft/buildImageTargetFileName/buildImageFormatOptions` 在定义与引用处命名一致。
- **关键决策**：复用既有 JSON 列承载图片数据，由 `engine` 路由；mode=LOCAL 复用本地上传/下载/删除/清理流程，无需新增路由或迁移大改。

