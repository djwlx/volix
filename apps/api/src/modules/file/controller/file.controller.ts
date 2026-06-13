import fs from 'fs';
import path from 'path';
import { v4 as uuidV4 } from 'uuid';
import { t } from '../../../utils/i18n';
import { log } from '../../../utils/logger';
import { PATH } from '../../../utils/path';
import { badRequest } from '../../shared/http-handler';
import { FileEntity } from '../model/file.model';
import { getFile, saveFile } from '../service/file.service';
import { UploadedFileFormData } from '../types/file.types';

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
  const file = ctx.request.files?.file as UploadedFileFormData | undefined;
  if (!file) {
    badRequest(t({ id: 'file.notFound', defaultMessage: '文件不存在' }));
  }

  const { originalFilename, size, mimetype, filepath } = file as UploadedFileFormData;
  const safeOriginalName = path.basename(originalFilename || 'upload.bin');
  const fileUuid = uuidV4();
  const newName = `${fileUuid}.${safeOriginalName}`;
  const newPath = `${PATH.upload}/${newName}`;
  const publicPath = `/file/${encodeURIComponent(newName)}`;

  await fs.promises.mkdir(PATH.upload, { recursive: true });
  await moveUploadedFile(filepath, newPath);

  log.info('文件上传成功', { uuid: fileUuid, name: safeOriginalName, size, mimeType: mimetype });

  return saveFile({
    extension: path.extname(safeOriginalName),
    name: safeOriginalName,
    uuid: fileUuid,
    size,
    mime_type: mimetype,
    path: publicPath,
  });
};

export const downloadFile: MyMiddleware = async ctx => {
  const { fileId } = ctx.params;
  const fileInfo = await getFile(fileId);
  if (!fileInfo) {
    log.warn('文件下载失败：文件不存在', { fileId });
    badRequest(t({ id: 'file.notFound', defaultMessage: '文件不存在' }));
  }

  const { name, mime_type } = fileInfo as FileEntity;
  const realPath = `${PATH.upload}/${fileId}.${name}`;
  ctx.response.set('Content-Type', mime_type);
  ctx.response.set('Content-Disposition', `inline; filename="${encodeURIComponent(name)}"`);
  ctx.body = fs.createReadStream(realPath);
};
