import fs from 'fs';
import path from 'path';
import {
  getUserCloudUploadDir,
  getUserFormatResultDir,
  getUserFormatTaskDir,
  getUserManualUploadDir,
} from '../../../utils/path';
import { registerOrGetFileByPath } from '../../file/service/file-registry.service';
import { log } from '../../../utils/logger';

const buildSourcePath = (baseDir: string, originalFilename: string, uniqueId: string) => {
  const safeOriginalName = path.basename(originalFilename || 'upload.bin');
  return path.join(baseDir, `${uniqueId}-${safeOriginalName}`);
};

export const getFormatConvertManualSourcePath = (dirKey: string, originalFilename: string, uniqueId: string) => {
  return buildSourcePath(getUserManualUploadDir(dirKey), originalFilename, uniqueId);
};

export const getFormatConvertCloudSourcePath = (dirKey: string, originalFilename: string, uniqueId: string) => {
  return buildSourcePath(getUserCloudUploadDir(dirKey), originalFilename, uniqueId);
};

export const getFormatConvertWorkspaceDir = (dirKey: string, taskId: number | string) => {
  return getUserFormatTaskDir(dirKey, taskId);
};

export const getFormatConvertWorkspaceFilePath = (dirKey: string, taskId: number | string, filename: string) => {
  return path.join(getFormatConvertWorkspaceDir(dirKey, taskId), filename);
};

export const getFormatConvertLogPath = (dirKey: string, taskId: number | string) => {
  return getFormatConvertWorkspaceFilePath(dirKey, taskId, 'ffmpeg.log');
};

export const getFormatConvertResultDir = (dirKey: string, taskId: number | string) => {
  return getUserFormatResultDir(dirKey, taskId);
};

export const getFormatConvertResultPath = (dirKey: string, taskId: number | string, filename: string) => {
  return path.join(getFormatConvertResultDir(dirKey, taskId), filename);
};

export const ensureFormatConvertWorkspace = async (dirKey: string, taskId: number | string) => {
  const workspaceDir = getFormatConvertWorkspaceDir(dirKey, taskId);
  await fs.promises.mkdir(workspaceDir, { recursive: true });
  return workspaceDir;
};

export const ensureFormatConvertResultDir = async (dirKey: string, taskId: number | string) => {
  const resultDir = getFormatConvertResultDir(dirKey, taskId);
  await fs.promises.mkdir(resultDir, { recursive: true });
  return resultDir;
};

export const cleanupFormatConvertWorkspace = async (taskIdOrDir: number | string) => {
  const workspaceDir = String(taskIdOrDir);
  await fs.promises.rm(workspaceDir, { recursive: true, force: true }).catch(() => undefined);
};

export const persistFormatConvertResult = async (
  dirKey: string,
  taskId: number | string,
  tempOutputPath: string,
  resultFilename: string,
  userId?: string | number
) => {
  const resultPath = getFormatConvertResultPath(dirKey, taskId, resultFilename);
  await ensureFormatConvertResultDir(dirKey, taskId);
  await fs.promises.copyFile(tempOutputPath, resultPath);

  if (userId !== undefined && userId !== null && String(userId)) {
    try {
      await registerOrGetFileByPath({
        userId,
        absolutePath: resultPath,
        originalName: resultFilename,
        dirKey,
        module: 'format-convert',
        visibility: 'private',
        metadata: { taskId: String(taskId) },
      });
    } catch (error) {
      log.warn('[format-convert] 结果文件登记失败', { taskId: String(taskId), error });
    }
  }

  return resultPath;
};
