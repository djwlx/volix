import fs from 'fs';
import path from 'path';
import { createHash } from 'crypto';
import type { UploadedFileMeta } from '@volix/types';
import { PATH } from '../../../utils/path';
import { getFile, saveFile } from '../../file';
import { getRequestUserAgent } from '../../../utils/request-context';

interface CacheRemoteAiImageAssetParams {
  sourceUrl: string;
  fileName: string;
  cacheKey?: string;
}

interface CacheRemoteAiImageAssetDeps {
  uploadDir?: string;
  fetchImpl?: typeof fetch;
  getFileByUuid?: (uuid: string) => Promise<UploadedFileMeta | undefined>;
  saveFileRecord?: (file: UploadedFileMeta) => Promise<UploadedFileMeta | undefined>;
}

const guessMimeType = (fileName: string) => {
  const extension = path.extname(fileName).toLowerCase();
  if (extension === '.png') {
    return 'image/png';
  }
  if (extension === '.webp') {
    return 'image/webp';
  }
  if (extension === '.gif') {
    return 'image/gif';
  }
  if (extension === '.bmp') {
    return 'image/bmp';
  }
  if (extension === '.svg') {
    return 'image/svg+xml';
  }
  return 'image/jpeg';
};

const createCacheKey = (value: string) => createHash('sha1').update(value).digest('hex');

export const cacheRemoteAiImageAsset = async (
  params: CacheRemoteAiImageAssetParams,
  deps: CacheRemoteAiImageAssetDeps = {}
) => {
  const uploadDir = deps.uploadDir || PATH.upload;
  const fetchImpl = deps.fetchImpl || fetch;
  const getFileByUuid = deps.getFileByUuid || getFile;
  const saveFileRecord = deps.saveFileRecord || saveFile;
  const safeOriginalName = path.basename(params.fileName || 'image.jpg');
  const cacheKey = params.cacheKey || createCacheKey(`${params.sourceUrl}|${safeOriginalName}`);
  const targetName = `${cacheKey}.${safeOriginalName}`;
  const targetPath = path.join(uploadDir, targetName);
  const publicPath = `/file/${encodeURIComponent(targetName)}`;
  const existingRecord = await getFileByUuid(cacheKey);
  const userAgent = getRequestUserAgent();

  try {
    await fs.promises.access(targetPath);
    if (existingRecord) {
      return {
        fileId: cacheKey,
        fileName: safeOriginalName,
        publicPath,
        cached: true,
      };
    }
  } catch {
    // ignore missing cache file and continue downloading below
  }

  await fs.promises.mkdir(uploadDir, { recursive: true });
  const response = await fetchImpl(params.sourceUrl, {
    headers: userAgent
      ? {
          'User-Agent': userAgent,
        }
      : undefined,
  });
  if (!response.ok) {
    throw new Error(`图片缓存失败（HTTP ${response.status}）`);
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  await fs.promises.writeFile(targetPath, buffer);

  if (!existingRecord) {
    await saveFileRecord({
      uuid: cacheKey,
      name: safeOriginalName,
      extension: path.extname(safeOriginalName),
      mime_type: response.headers.get('content-type') || guessMimeType(safeOriginalName),
      size: buffer.length,
      path: publicPath,
      storage: 'local',
      status: 'normal',
    });
  }

  return {
    fileId: cacheKey,
    fileName: safeOriginalName,
    publicPath,
    cached: false,
  };
};
