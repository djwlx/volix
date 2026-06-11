import fs from 'fs';
import path from 'path';
import request from '../../../utils/request';
import { createOpenlistSdk } from '../../../sdk/openlist';
import { getUserAccountConfigs } from '../../user/service/user-config.service';
import type {
  FormatConvertOpenlistBrowserResult,
  FormatConvertOpenlistSource,
  FormatConvertOpenlistTarget,
} from '@volix/types';

const normalizeUserId = (userId: string | number) => String(userId || '').trim();

const createUserOpenlistSdk = async (userId: string | number) => {
  const accountConfigs = await getUserAccountConfigs(normalizeUserId(userId));
  const config = accountConfigs.openlist;
  if (!config) {
    throw new Error('openlist account config missing');
  }

  const sdk = createOpenlistSdk({
    apiHost: config.baseUrl,
  });

  await sdk.loginWithHashedPassword(config.username, config.password);
  return sdk;
};

export const listFormatConvertOpenlistFs = async (
  userId: string | number,
  dirPath: string
): Promise<FormatConvertOpenlistBrowserResult> => {
  const sdk = await createUserOpenlistSdk(userId);
  const result = await sdk.listFs({
    path: dirPath,
    perPage: 500,
    page: 1,
    refresh: false,
  });
  const currentDir = dirPath.trim() || '/';
  return {
    path: currentDir,
    total: result.total,
    content: (result.content || []).map(item => ({
      name: item.name,
      path: path.posix.join(currentDir, item.name),
      isDir: Boolean(item.is_dir),
      size: Number(item.size || 0),
      modified: item.modified,
    })),
  };
};

export const getFormatConvertOpenlistSource = async (userId: string | number, filePath: string) => {
  const sdk = await createUserOpenlistSdk(userId);
  return sdk.getFs({
    path: filePath,
  });
};

export const downloadFormatConvertOpenlistSource = async (
  userId: string | number,
  source: FormatConvertOpenlistSource,
  targetPath: string
) => {
  const sourceInfo = await getFormatConvertOpenlistSource(userId, source.path);
  const rawUrl = String(sourceInfo.raw_url || '').trim();
  if (!rawUrl) {
    throw new Error('openlist source raw url missing');
  }

  await fs.promises.mkdir(path.dirname(targetPath), { recursive: true });
  const response = await request({
    url: rawUrl,
    method: 'GET',
    responseType: 'stream',
  });

  await new Promise<void>((resolve, reject) => {
    const writer = fs.createWriteStream(targetPath);
    response.data.pipe(writer);
    response.data.on('error', reject);
    writer.on('error', reject);
    writer.on('finish', resolve);
  });

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
  await sdk.uploadFileByStream({
    path: target.dirPath,
    filename,
    stream: fs.createReadStream(localPath),
  });
  return path.posix.join(target.dirPath, filename);
};
