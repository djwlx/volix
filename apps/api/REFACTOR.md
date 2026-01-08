# API 重构指南（面向对象 → 函数式）

## 一、目标与约束

- 目标：将 `apps/api` 内的后端代码从面向对象（class/实例）风格迁移为函数式/模块化导出风格，提高可测试性与可组合性。 
-- 约束：架构文件夹（顶层目录结构）应保持不变以维持项目组织，但单个源文件名可以调整以配合重构。
-- 要求：功能路径（即对外的 API 路由）必须保持不变，外部行为不可更改；源文件名或内部导入路径可以更新，路由层在必要时做最小修改以适配新的文件名。

## 二、总体策略

保持架构目录不变，功能路径（即外部路由）保持不变；源文件名可以变更以支持更清晰的模块划分. 导出签名不强制向后兼容：推荐直接导出具名函数以利于 tree-shaking 与测试；如需平滑迁移，可临时额外导出组合对象以减少改动。
- 将每个类替换为一组纯函数或一个包含函数属性的普通对象。服务层同理：把类方法拆为独立函数并导出，或导出一个函数集合对象。
- 抽取公共行为到工具函数（例如原 `BaseController.res` 的包装器 `withResponse`），放入 `utils` 下，供各控制器复用。

## 三、命名与导出规范（建议）

- 文件名：保持原有文件名（受约束）；内部导出函数使用 `camelCase`。
- 控制器导出：保持 `export const <name>` 或 `export { <name> }` 形式，且导出对象包含路由所需的处理函数；例如 `export const fileController = { upload, download }`。
服务导出：将服务类的方法拆为具名导出函数，例如 `export async function saveFile(...)`。默认不再要求导出兼容对象，直接使用具名函数是首选；若项目需要平滑过渡，可额外导出组合对象作为可选兼容层。
- 异常与响应：统一用 `withResponse(handler)` 包装处理函数，内部负责 try/catch 与标准响应格式。

## 四、示例：从 `FileController` 的 class 迁移为函数式实现（保持导出名不变）

1) 新增或复用包装器（建议放 `apps/api/app/utils/response.ts`）：

```typescript
import { resError, resSuccess } from './response';
import { log } from './logger';

export function withResponse(handler: MyMiddleware): MyMiddleware {
  return async (ctx, next) => {
    try {
      const result = await handler(ctx, next);
      if (result !== undefined) {
        return resSuccess(ctx, { data: result });
      }
    } catch (err) {
      log.error(err);
      resError(ctx, { code: 500, message: '服务器错误' });
    }
  };
}
```

2) 将 `apps/api/app/controller/file-controller.ts` 改为函数式（保持文件路径与导出名称）：

```typescript
import path from 'path';
import { fileService, FileType } from '../service';
import { resError } from '../utils/response';
import { v4 as uuidV4 } from 'uuid';
import { getRootPath } from '../utils/path';
import fs from 'fs';
import { withResponse } from '../utils/response';

async function uploadHandler(ctx) {
  const file: any = ctx.request.files?.file;
  if (!file) {
    resError(ctx, { code: 400, message: '文件不存在' });
    return;
  }
  const { originalFilename, size, mimetype, filepath } = file;
  const rootPath = getRootPath();
  const fileUuid = uuidV4();
  const newName = `${fileUuid}.${originalFilename}`;
  const newPath = `${rootPath}/uploads/${newName}`;
  fs.renameSync(filepath, newPath);
  const fileInfo = {
    extension: path.extname(originalFilename),
    name: originalFilename,
    uuid: fileUuid,
    size,
    mime_type: mimetype,
    path: `/api/download/${fileUuid}`,
  };
  const result = await fileService.saveFile(fileInfo);
  return result;
}

async function downloadHandler(ctx) {
  const { fileId } = ctx.params;
  const fileInfo = await fileService.getFile(fileId);
  if (!fileInfo) {
    resError(ctx, { code: 400, message: '文件不存在' });
    return;
  }
  const { name, mime_type } = fileInfo as FileType;
  const rootPath = getRootPath();
  const realPath = `${rootPath}/uploads/${fileId}.${name}`;
  ctx.response.set('Content-Type', mime_type);
  ctx.response.set('Content-Disposition', `inline; filename="${encodeURIComponent(name)}"`);
  ctx.body = fs.createReadStream(realPath);
}

export const fileController = {
  upload: withResponse(uploadHandler),
  download: withResponse(downloadHandler),
};
```

说明：路由无需变更，依然使用 `fileController.upload` 与 `fileController.download`。

## 五、服务层示例（从 class 到函数）

原来：
```typescript
class FileService {
  async saveFile(info) { /* ... */ }
  async getFile(id) { /* ... */ }
}
export const fileService = new FileService();
```

建议迁移为：
```typescript
export async function saveFile(info) { /* ... */ }
export async function getFile(id) { /* ... */ }
```

这样既能逐步迁移调用方，又能导出更易 tree-shake 的具名函数。

## 六、控制器/服务/模型 映射表（迁移规则一览）

- controllers/*.ts
  - class XController => 导出同名对象 `export const xController = { handlerA, handlerB }`。
  - 若现有 `BaseController` 提供通用包装，替换为 `utils/withResponse` 并在每个控制器中使用。
- service/*.ts
  - class XxxService => 具名导出函数 + `export const xxxService = { ... }` 兼容。
- model/*.ts
  - ORM model 通常保留类/实例（如 Sequelize），不强制转换，但鼓励导出基于模型的纯查询函数（例如 `export async function findUserById()`）。

## 七、迁移步骤建议（按小步、可回滚）

1. 在 `apps/api/app/utils` 中实现 `withResponse`（保证行为与 `BaseController.res` 等价）。
2. 选取单个控制器（如 `file-controller.ts`）实现函数式重写并导出 `fileController`（如示例）。
3. 本地运行并验证路由（`/file/upload` 与 `/file/download/:fileId`）行为一致。
4. 逐个迁移服务层：把服务方法拆为具名函数并同时导出兼容对象。
5. 将 `BaseController` 的文件改为说明或移除（在完全迁移后）。
6. 编写单元/集成测试覆盖关键路径并运行 CI。

## 八、自动化迁移建议

- 使用 `jscodeshift` / `ts-morph` 编写 codemod 脚本：
  - 查找 `class XController`、将 `method = this.res(...)` 模式替换为独立函数并生成导出对象。
  - 将 `new XxxService()` 替换为导出对象的形式。
- 每次 codemod 运行后，手动审核变更并运行测试。

## 九、测试与回滚

- 在每个文件迁移后立即运行应用以及现有单测（若无单测，手动通过 Postman 或 curl 做烟雾测试）。
- 保留旧实现一小段时间（例如通过并行导出 `fileControllerLegacy`）以便回滚。

## 十、示例迁移优先级（建议）

- 优先级高：`file-controller.ts`、`user-controller.ts`（外部认证/上传下载）、`service/file.ts`。
- 中等：`task-controller.ts`、`115-controller.ts`、`drive/*` 驱动类（慎重处理依赖）。

---

如需，我可以：
- 提交一个示范补丁（将 `file-controller.ts` 改写为函数式，并添加 `withResponse`），或
- 生成 `jscodeshift` 脚本的初版用于批量迁移。

请选择下一步：生成示范补丁 / 生成 codemod / 仅保留文档。