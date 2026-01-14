import path from 'path';
import { fileService, FileType } from '../service';
import { resError } from '../utils/response';
import { BaseController } from './base-controller';
import { v4 as uuidV4 } from 'uuid';
import { PATH } from '../utils/path';
import fs from 'fs';

class FileController extends BaseController {
  // 上传
  upload = this.res(async ctx => {
    const file: any = ctx.request.files?.file;
    if (!file) {
      resError(ctx, {
        code: 400,
        message: '文件不存在',
      });
    }

    const { originalFilename, size, mimetype, filepath } = file;

    const fileUuid = uuidV4();

    const newName = `${fileUuid}.${originalFilename}`;
    const newPath = `${PATH.upload}/${newName}`;

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
  });
  // 下载
  download = this.res(async ctx => {
    const { fileId } = ctx.params;
    const fileInfo = await fileService.getFile(fileId);
    if (!fileInfo) {
      resError(ctx, {
        code: 400,
        message: '文件不存在',
      });
    }
    const { name, mime_type } = fileInfo as FileType;

    const realPath = `${PATH.upload}/${fileId}.${name}`;
    ctx.response.set('Content-Type', mime_type);
    ctx.response.set('Content-Disposition', `inline; filename="${encodeURIComponent(name)}"`);
    ctx.body = fs.createReadStream(realPath);
  });
}

const fileController = new FileController();
export { fileController };
