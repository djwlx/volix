import fs from 'fs';
import mime from 'mime-types';
import path from 'path';
import { v4 as uuidV4 } from 'uuid';
import { t } from '../../../utils/i18n';
import { log } from '../../../utils/logger';
import { getUserManualUploadDir } from '../../../utils/path';
import { resolveUserDirKeyOrThrow } from '../../user/service/user-dir.service';
import { badRequest, unauthorized } from '../../shared/http-handler';
import { UploadedFileFormData } from '../types/file.types';

const DIR_KEY_REGEXP = /^[a-z0-9_-]+$/;

const moveUploadedFile = async (sourcePath: string, targetPath: string): Promise<void> => {
  try {
    await fs.promises.rename(sourcePath, targetPath);
  } catch (error) {
    const err = error as NodeJS.ErrnoException;
    // Docker/container environments often store temp files on a different
    // mount point than the upload directory; rename fails with EXDEV then.
    if (err.code === 'EXDEV') {
      await fs.promises.copyFile(sourcePath, targetPath);
      await fs.promises.unlink(sourcePath);
      return;
    }
    throw error;
  }
};

export const uploadFile: MyMiddleware = async ctx => {
  const userId = ctx.state.userInfo?.id;
  if (userId === undefined || userId === null) {
    unauthorized(t({ id: 'auth.unauthorized', defaultMessage: '未登录' }));
    return;
  }

  const file = ctx.request.files?.file as UploadedFileFormData | undefined;
  if (!file) {
    badRequest(t({ id: 'file.notFound', defaultMessage: '文件不存在' }));
    return;
  }

  const { originalFilename, size, mimetype, filepath } = file;
  const safeOriginalName = path.basename(originalFilename || 'upload.bin');
  const fileUuid = uuidV4();
  const newName = `${fileUuid}.${safeOriginalName}`;

  const dirKey = await resolveUserDirKeyOrThrow(userId);
  const manualDir = getUserManualUploadDir(dirKey);
  const newPath = path.join(manualDir, newName);
  const publicPath = `/api/file/${dirKey}/${encodeURIComponent(newName)}`;

  await fs.promises.mkdir(manualDir, { recursive: true });
  await moveUploadedFile(filepath, newPath);

  log.info('文件上传成功', { uuid: fileUuid, name: safeOriginalName, size, mimeType: mimetype, dirKey });

  return {
    extension: path.extname(safeOriginalName),
    name: safeOriginalName,
    uuid: fileUuid,
    size,
    mime_type: mimetype,
    path: publicPath,
    storage: 'local' as const,
    status: 'normal' as const,
  };
};

export const serveUserFile: MyMiddleware = async ctx => {
  const dirKey = String(ctx.params.dirKey || '')
    .trim()
    .toLowerCase();
  const fileName = path.basename(String(ctx.params.fileName || '').trim());

  if (!DIR_KEY_REGEXP.test(dirKey) || !fileName || fileName.includes('..')) {
    badRequest(t({ id: 'file.notFound', defaultMessage: '文件不存在' }));
    return;
  }

  let manualDir = '';
  try {
    manualDir = getUserManualUploadDir(dirKey);
  } catch {
    badRequest(t({ id: 'file.notFound', defaultMessage: '文件不存在' }));
    return;
  }

  const filePath = path.join(manualDir, fileName);
  const stat = await fs.promises.stat(filePath).catch(() => null);
  if (!stat?.isFile()) {
    badRequest(t({ id: 'file.notFound', defaultMessage: '文件不存在' }));
    return;
  }

  ctx.response.set('Content-Type', mime.lookup(fileName) || 'application/octet-stream');
  ctx.response.set('Content-Disposition', `inline; filename="${encodeURIComponent(fileName)}"`);
  ctx.body = fs.createReadStream(filePath);
};
