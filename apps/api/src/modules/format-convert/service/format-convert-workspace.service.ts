import fs from 'fs';
import path from 'path';
import { PATH } from '../../../utils/path';

export const getFormatConvertWorkspaceDir = (taskId: number | string) => {
  return path.join(PATH.cacheMediaFormatConvert, String(taskId));
};

export const getFormatConvertWorkspaceFilePath = (taskId: number | string, filename: string) => {
  return path.join(getFormatConvertWorkspaceDir(taskId), filename);
};

export const getFormatConvertLogPath = (taskId: number | string) => {
  return getFormatConvertWorkspaceFilePath(taskId, 'ffmpeg.log');
};

export const getFormatConvertResultDir = (taskId: number | string) => {
  return path.join(PATH.uploadFormatConvert, String(taskId));
};

export const getFormatConvertResultPath = (taskId: number | string, filename: string) => {
  return path.join(getFormatConvertResultDir(taskId), filename);
};

export const ensureFormatConvertWorkspace = async (taskId: number | string) => {
  const workspaceDir = getFormatConvertWorkspaceDir(taskId);
  await fs.promises.mkdir(workspaceDir, { recursive: true });
  return workspaceDir;
};

export const ensureFormatConvertResultDir = async (taskId: number | string) => {
  const resultDir = getFormatConvertResultDir(taskId);
  await fs.promises.mkdir(resultDir, { recursive: true });
  return resultDir;
};

export const cleanupFormatConvertWorkspace = async (taskIdOrDir: number | string) => {
  const workspaceDir =
    String(taskIdOrDir).includes(path.sep) || String(taskIdOrDir).startsWith('/')
      ? String(taskIdOrDir)
      : getFormatConvertWorkspaceDir(taskIdOrDir);
  await fs.promises.rm(workspaceDir, { recursive: true, force: true }).catch(() => undefined);
};

export const persistFormatConvertResult = async (
  taskId: number | string,
  tempOutputPath: string,
  resultFilename: string
) => {
  const resultPath = getFormatConvertResultPath(taskId, resultFilename);
  await ensureFormatConvertResultDir(taskId);
  await fs.promises.copyFile(tempOutputPath, resultPath);
  return resultPath;
};
