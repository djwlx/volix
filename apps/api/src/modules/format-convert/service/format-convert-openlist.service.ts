import fs from 'fs';
import path from 'path';
import { pipeline } from 'stream/promises';
import request from '../../../utils/request';
import { createOpenlistSdk } from '../../../sdk/openlist';
import { getUserAccountConfigs } from '../../user/service/user-config.service';
import type {
  FormatConvertOpenlistBrowserResult,
  FormatConvertOpenlistSource,
  FormatConvertOpenlistTarget,
} from '@volix/types';

const normalizeUserId = (userId: string | number) => String(userId || '').trim();

const isOpenlistStorageMissingError = (error: unknown) => {
  const message = error instanceof Error ? error.message : String(error || '');
  return /failed get storage|storage not found/i.test(message);
};

const createUserOpenlistSdk = async (userId: string | number, userAgent?: string) => {
  const accountConfigs = await getUserAccountConfigs(normalizeUserId(userId));
  const config = accountConfigs.openlist;
  if (!config) {
    throw new Error('openlist account config missing');
  }

  const sdk = createOpenlistSdk({
    apiHost: config.baseUrl,
    userAgent,
  });

  await sdk.loginWithHashedPassword(config.username, config.password);
  return sdk;
};

export const listFormatConvertOpenlistFs = async (
  userId: string | number,
  dirPath: string,
  page = 1,
  perPage = 20
): Promise<FormatConvertOpenlistBrowserResult> => {
  const sdk = await createUserOpenlistSdk(userId);
  const currentDir = dirPath.trim() || '/';
  const result = await sdk.listFs({
    path: currentDir,
    page,
    perPage,
    refresh: false,
  });
  return {
    path: currentDir,
    page,
    perPage,
    total: Number(result.total || 0),
    content: (result.content || []).map(item => ({
      name: item.name,
      path: path.posix.join(currentDir, item.name),
      isDir: Boolean(item.is_dir),
      size: Number(item.size || 0),
      modified: item.modified,
    })),
  };
};

export const getFormatConvertOpenlistSource = async (userId: string | number, filePath: string, userAgent?: string) => {
  const sdk = await createUserOpenlistSdk(userId, userAgent);
  return sdk.getFs({
    path: filePath,
  });
};

export const downloadFormatConvertOpenlistSource = async (
  userId: string | number,
  source: FormatConvertOpenlistSource,
  targetPath: string,
  userAgent?: string
) => {
  const sourceInfo = await getFormatConvertOpenlistSource(userId, source.path, userAgent);
  const rawUrl = String(sourceInfo.raw_url || '').trim();
  if (!rawUrl) {
    throw new Error('openlist source raw url missing');
  }

  await fs.promises.mkdir(path.dirname(targetPath), { recursive: true });
  const response = await request({
    url: rawUrl,
    method: 'GET',
    responseType: 'stream',
    headers: userAgent
      ? {
          'User-Agent': userAgent,
        }
      : undefined,
  });

  await pipeline(response.data, fs.createWriteStream(targetPath));

  return {
    targetPath,
    sourceInfo,
  };
};

export const uploadFormatConvertResultToOpenlist = async (
  userId: string | number,
  target: FormatConvertOpenlistTarget,
  localPath: string
) => {
  const sdk = await createUserOpenlistSdk(userId);
  const filename = String(target.fileName || path.basename(localPath)).trim() || path.basename(localPath);
  const stream = fs.createReadStream(localPath);
  try {
    await sdk.uploadFileByStream({
      path: target.dirPath,
      filename,
      stream,
    });
  } catch (error) {
    if (isOpenlistStorageMissingError(error)) {
      throw new Error('OpenList 目标目录未映射到可写存储，请选择具体的挂载目录后重试');
    }
    throw error;
  } finally {
    stream.destroy();
  }
  return path.posix.join(target.dirPath, filename);
};
