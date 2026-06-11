import fs from 'fs';
import path from 'path';
import mime from 'mime-types';
import { v4 as uuidV4 } from 'uuid';
import type { CreateFormatConvertTaskRequest } from '@volix/types';
import {
  FORMAT_CONVERT_FAILED_STATUSES,
  FormatConvertTaskStatus,
  FormatConvertMode,
  FormatConvertSourceType,
  FormatConvertTargetType,
} from '@volix/types';
import { PATH } from '../../../utils/path';
import { t } from '../../../utils/i18n';
import { badRequest, unauthorized } from '../../shared/http-handler';
import { UploadedFileFormData } from '../../file/types/file.types';
import {
  buildFormatConvertCleanupPayload,
  cleanupFormatConvertTaskLocalArtifacts,
  hasFormatConvertLocalArtifacts,
} from '../service/format-convert-artifact.service';
import { normalizeFormatConvertOption } from '../service/format-convert-option.service';
import {
  createFormatConvertTask,
  getFormatConvertTaskByIdAndUserId,
  listFormatConvertTasksByUserId,
  resetFormatConvertTaskToPending,
  updateFormatConvertTask,
} from '../service/format-convert-task-db.service';
import { ensureFormatConvertQueueRunning } from '../service/format-convert-queue.service';
import { listFormatConvertOpenlistFs } from '../service/format-convert-openlist.service';
import { probeMediaFile } from '../service/format-convert-ffmpeg.service';

const ensureLoginUserId = (ctx: any) => {
  const userId = ctx.state.userInfo?.id;
  if (!userId) {
    unauthorized(t({ id: 'auth.unauthorized', defaultMessage: '未登录' }));
  }
  return String(userId);
};

const moveUploadedFile = async (sourcePath: string, targetPath: string) => {
  try {
    await fs.promises.rename(sourcePath, targetPath);
  } catch (error) {
    const err = error as NodeJS.ErrnoException;
    if (err.code === 'EXDEV') {
      await fs.promises.copyFile(sourcePath, targetPath);
      await fs.promises.unlink(sourcePath);
      return;
    }
    throw error;
  }
};

const parseJsonField = <T>(value: unknown): T => {
  if (typeof value === 'string') {
    return JSON.parse(value) as T;
  }
  return value as T;
};

const buildStoredUploadPath = (originalFilename: string) => {
  const safeOriginalName = path.basename(originalFilename || 'upload.bin');
  return path.join(PATH.uploadFormatConvert, 'sources', `${uuidV4()}-${safeOriginalName}`);
};

const sendDownloadFile = async (ctx: any, filePath: string, fallbackMessageId: string, fallbackMessage: string) => {
  const resolvedPath = String(filePath || '').trim();
  if (!resolvedPath) {
    badRequest(t({ id: fallbackMessageId, defaultMessage: fallbackMessage }));
    return;
  }

  const exists = await fs.promises
    .access(resolvedPath, fs.constants.F_OK)
    .then(() => true)
    .catch(() => false);
  if (!exists) {
    badRequest(t({ id: fallbackMessageId, defaultMessage: fallbackMessage }));
    return;
  }

  const filename = path.basename(resolvedPath);
  ctx.response.set('Content-Type', mime.lookup(filename) || 'application/octet-stream');
  ctx.response.set('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`);
  ctx.body = fs.createReadStream(resolvedPath);
};

export const createLocalFormatConvertTask: MyMiddleware = async ctx => {
  const userId = ensureLoginUserId(ctx);
  const file = ctx.request.files?.file as UploadedFileFormData | undefined;
  if (!file) {
    badRequest(t({ id: 'file.notFound', defaultMessage: '文件不存在' }));
  }

  const payload = parseJsonField<Omit<CreateFormatConvertTaskRequest, 'mode' | 'source'>>(
    ctx.request.body?.payload || '{}'
  );
  const storedUploadPath = buildStoredUploadPath(file?.originalFilename || 'upload.bin');
  await fs.promises.mkdir(path.dirname(storedUploadPath), { recursive: true });
  await moveUploadedFile(String(file?.filepath || ''), storedUploadPath);
  await probeMediaFile(storedUploadPath);

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
    source: {
      type: FormatConvertSourceType.UPLOAD,
      fileName: path.basename(file?.originalFilename || 'upload.bin'),
      mimeType: file?.mimetype,
      size: file?.size,
      uploadPath: storedUploadPath,
    },
    option,
  });

  void ensureFormatConvertQueueRunning();
  return { task };
};

export const createCloudFormatConvertTask: MyMiddleware = async ctx => {
  const userId = ensureLoginUserId(ctx);
  const payload = (ctx.request.body || {}) as CreateFormatConvertTaskRequest;

  if (payload.source?.type !== FormatConvertSourceType.OPENLIST) {
    badRequest(t({ id: 'formatConvert.error.invalidCloudSource', defaultMessage: '云转换源文件必须来自 OpenList' }));
  }
  if (payload.target?.type !== FormatConvertTargetType.OPENLIST) {
    badRequest(t({ id: 'formatConvert.error.invalidCloudTarget', defaultMessage: '云转换目标必须是 OpenList 目录' }));
  }

  const option = normalizeFormatConvertOption({
    commandMode: payload.commandMode,
    presetId: payload.presetId,
    option: payload.option,
  });

  const task = await createFormatConvertTask({
    ...payload,
    userId,
    mode: FormatConvertMode.CLOUD,
    option,
  });

  void ensureFormatConvertQueueRunning();
  return { task };
};

export const getFormatConvertTasks: MyMiddleware = async ctx => {
  const userId = ensureLoginUserId(ctx);
  return {
    items: await listFormatConvertTasksByUserId(userId),
  };
};

export const retryFormatConvertTask: MyMiddleware = async ctx => {
  const userId = ensureLoginUserId(ctx);
  const taskId = Number(ctx.params.id || 0);
  const task = await getFormatConvertTaskByIdAndUserId(taskId, userId);
  if (!task) {
    badRequest(t({ id: 'formatConvert.error.taskNotFound', defaultMessage: '格式转换任务不存在' }));
    return;
  }
  if (!FORMAT_CONVERT_FAILED_STATUSES.includes(task.status as never)) {
    badRequest(t({ id: 'formatConvert.error.retryNotAllowed', defaultMessage: '当前任务状态不允许重试' }));
    return;
  }

  await resetFormatConvertTaskToPending(taskId);
  void ensureFormatConvertQueueRunning();
  return {
    success: true,
  };
};

export const downloadFormatConvertResult: MyMiddleware = async ctx => {
  const userId = ensureLoginUserId(ctx);
  const taskId = Number(ctx.params.id || 0);
  const task = await getFormatConvertTaskByIdAndUserId(taskId, userId);
  if (!task) {
    badRequest(t({ id: 'formatConvert.error.taskNotFound', defaultMessage: '格式转换任务不存在' }));
    return;
  }

  await sendDownloadFile(ctx, task.resultLocalPath || '', 'formatConvert.error.resultNotFound', '格式转换结果不存在');
};

export const downloadFormatConvertLog: MyMiddleware = async ctx => {
  const userId = ensureLoginUserId(ctx);
  const taskId = Number(ctx.params.id || 0);
  const task = await getFormatConvertTaskByIdAndUserId(taskId, userId);
  if (!task) {
    badRequest(t({ id: 'formatConvert.error.taskNotFound', defaultMessage: '格式转换任务不存在' }));
    return;
  }

  await sendDownloadFile(ctx, task.logLocalPath || '', 'formatConvert.error.logNotFound', '格式转换日志不存在');
};

export const cleanupFormatConvertTaskFiles: MyMiddleware = async ctx => {
  const userId = ensureLoginUserId(ctx);
  const taskId = Number(ctx.params.id || 0);
  const task = await getFormatConvertTaskByIdAndUserId(taskId, userId);
  if (!task) {
    badRequest(t({ id: 'formatConvert.error.taskNotFound', defaultMessage: '格式转换任务不存在' }));
    return;
  }
  if (task.status !== FormatConvertTaskStatus.COMPLETED) {
    badRequest(t({ id: 'formatConvert.error.cleanupNotAllowed', defaultMessage: '当前任务状态不允许清理本地文件' }));
    return;
  }
  if (!hasFormatConvertLocalArtifacts(task)) {
    return { success: true, task };
  }

  await cleanupFormatConvertTaskLocalArtifacts(task);
  const nextTask = await updateFormatConvertTask(task.id, buildFormatConvertCleanupPayload(task));
  return {
    success: true,
    task: nextTask,
  };
};

export const listOpenlistFsForFormatConvert: MyMiddleware = async ctx => {
  const userId = ensureLoginUserId(ctx);
  const dirPath = String(ctx.query.path || '/').trim() || '/';
  return listFormatConvertOpenlistFs(userId, dirPath);
};
