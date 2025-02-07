import { resError, resSuccess } from '../utils/response';
import { v4 as uuidV4 } from 'uuid';
import fs from 'fs';
import { getRootPath } from '../utils/path';
import mime from 'mime-types';
import { getFile, getFileInfoByFileId, transPdfToImg } from '../utils/file';
import { execSync } from 'child_process';

class FileController {
  // 上传文件
  static upload: MyMiddleware = async (ctx, next) => {
    const file: any = ctx.request.files?.file;
    if (!file) {
      resError(ctx, {
        code: 400,
        message: '文件不存在',
      });
    }
    // 临时文件
    const { originalFilename, size, mimetype, filepath } = file;
    const uuid = uuidV4();
    const rootPath = getRootPath();
    const newName = `${uuid}.${originalFilename}`;

    const findInfo = {
      name: originalFilename,
      uuid: newName,
      size,
      type: mimetype,
      url: `/api/file/download/${newName}`,
    };

    fs.renameSync(filepath, `${rootPath}/uploads/${newName}`);

    ctx.body = {
      code: 0,
      message: 'success',
      data: {
        ...findInfo,
      },
    };
  };

  // 下载文件
  static download: MyMiddleware = async (ctx, next) => {
    const fileIdTemp = ctx.params.fileId;
    const fileId = decodeURIComponent(fileIdTemp);
    const rootPath = getRootPath();
    const filePath = `${rootPath}/uploads/${fileId}`;
    const index = fileId.indexOf('.'); // 查找第一个'·'的索引
    const fileRealName = fileId.substring(index + 1); // 截取索引+1后面的所有内容
    const mimeTpye = mime.lookup(fileId);
    ctx.response.set('Content-Type', mimeTpye || 'image/jpeg');
    // 将文件内容作为响应体返回给客户端
    ctx.response.set('Content-Disposition', `attachment; filename="${encodeURIComponent(fileRealName)}"`);
    ctx.body = fs.createReadStream(filePath);
  };

  // pdf转图片
  static pdfToImg: MyMiddleware = async (ctx, next) => {
    const { fileId } = ctx.request?.body || {};
    const filePath = getFile(ctx, fileId);
    try {
      const { fileId } = await transPdfToImg(filePath);
      resSuccess(ctx, {
        data: { fileId },
      });
    } catch (e) {
      resError(ctx, {
        code: 500,
        message: '失败',
      });
    }
  };

  // 删除pdf的密码
  static unlockPdf: MyMiddleware = async (ctx, next) => {
    const { fileId, password } = ctx.request?.body || {};
    const filePath = getFile(ctx, fileId);
    const { fileNameWithoutExtension } = getFileInfoByFileId(fileId);

    const rootPath = getRootPath();
    const uuid = uuidV4();
    const outputFileName = `${uuid}.${fileNameWithoutExtension}-unlock.pdf`;
    const outputPath = `${rootPath}/uploads/${outputFileName}`;

    // 解锁pdf
    execSync(
      `gs -q -dNOPAUSE -dBATCH -sDEVICE=pdfwrite -sPDFPassword=${password} -sOutputFile="${outputPath}" "${filePath}"`
    );
    resSuccess(ctx, {
      data: { fileId: outputFileName },
      message: '转化成功',
    });
  };
}

export default FileController;
