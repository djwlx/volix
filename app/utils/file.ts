import fs from 'fs';
import { ImageMagick } from 'pdf-images';
import path from 'path';
import AdmZip from 'adm-zip';
import fsExtra from 'fs-extra';
import { getRootPath } from './path';
import { MyContext } from '..';
import { resError } from './response';

// 没有文件夹自动创建
export const getOrMakeDir = (dirPath: string) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }

  return dirPath;
};

//将pdf转化为图片并压缩为压缩包
export const transPdfToImg = async (filePath: string) => {
  const fileNameWithExtension = path.basename(filePath);
  const fileExtension = path.extname(fileNameWithExtension);
  const fileName = fileNameWithExtension.replace(fileExtension, '');
  const dirPath = path.dirname(filePath);

  const outputPath = getOrMakeDir(`${dirPath}/output`);
  const foldDir = `${outputPath}/${fileName}`;
  await ImageMagick.convertAsync(filePath, outputPath, fileName, ' -background none -alpha remove -trim');
  // 压缩为压缩包
  const zipDir = `${dirPath}/${fileName}.zip`;
  const zip = new AdmZip();
  zip.addLocalFolder(foldDir);
  zip.writeZip(zipDir);
  const zipFileName = `${fileName}.zip`;

  // 删除图片目录
  fsExtra.removeSync(foldDir);

  return {
    fileId: zipFileName,
  };
};

// 根据文件id获取文件
export const getFile = (ctx: MyContext, fileId: string) => {
  if (!fileId) {
    resError(ctx, {
      code: 400,
      message: '文件不存在',
    });
  }
  const rootPath = getRootPath();
  const filePath = `${rootPath}/uploads/${fileId}`;
  if (!fs.existsSync(filePath)) {
    resError(ctx, {
      code: 400,
      message: '文件不存在',
    });
  }
  return filePath;
};

// 根据文件id获取文件信息
export const getFileInfoByFileId = (fileId: string) => {
  const index = fileId.indexOf('.');
  const FileName = fileId.substring(index + 1);
  const fileExtension = path.extname(fileId);

  const realFileName = decodeURIComponent(FileName);
  const fileNameWithoutExtension = path.basename(realFileName, fileExtension);

  return {
    realFileName,
    fileExtension,
    fileNameWithoutExtension,
  };
};
