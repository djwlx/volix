import fs from 'fs';
import path from 'path';
import { v4 as uuidV4 } from 'uuid';
import { PATH } from '../../../utils/path';
import { badRequest } from '../../shared/http-handler';
import { FileEntity } from '../model/file.model';
import { getFile, saveFile } from '../service/file.service';
import { UploadedFileFormData } from '../types/file.types';

export const uploadFile: MyMiddleware = async ctx => {
  const file = ctx.request.files?.file as UploadedFileFormData | undefined;
  if (!file) {
    badRequest('文件不存在');
  }

  const { originalFilename, size, mimetype, filepath } = file as UploadedFileFormData;
  const fileUuid = uuidV4();
  const newName = `${fileUuid}.${originalFilename}`;
  const newPath = `${PATH.upload}/${newName}`;

  fs.renameSync(filepath, newPath);

  return saveFile({
    extension: path.extname(originalFilename),
    name: originalFilename,
    uuid: fileUuid,
    size,
    mime_type: mimetype,
    path: `/api/download/${fileUuid}`,
  });
};

export const downloadFile: MyMiddleware = async ctx => {
  const { fileId } = ctx.params;
  const fileInfo = await getFile(fileId);
  if (!fileInfo) {
    badRequest('文件不存在');
  }

  const { name, mime_type } = fileInfo as FileEntity;
  const realPath = `${PATH.upload}/${fileId}.${name}`;
  ctx.response.set('Content-Type', mime_type);
  ctx.response.set('Content-Disposition', `inline; filename="${encodeURIComponent(name)}"`);
  ctx.body = fs.createReadStream(realPath);
};
