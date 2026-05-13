import fs from 'fs';
import path from 'path';
import type { Cloud115DbFileItem, PicRandomCacheConfig } from '../../types/115.types';
import { getFile115ByPc } from '../file-db.service';
import {
  type RandomLocalCacheItem,
  type RandomMemoryCacheItem,
  DEFAULT_MIME_TYPE,
  addRandomMemoryCacheTotalBytes,
  clearRandomMemoryCacheByPc,
  evictRandomMemoryCacheUntilFit,
  getRandomCacheMetaByPc,
  getRandomMemoryCacheTotalBytes,
  randomMemoryCacheKeyByFileName,
  randomMemoryCacheMap,
} from './picture-cache-random-core';

export { clearRandomMemoryCacheByPc };

export const tryAddRandomMemoryCacheByLocalItem = async (
  localItem: RandomLocalCacheItem,
  config: PicRandomCacheConfig
) => {
  const memoryMaxSizeBytes = config.memoryMaxSizeMb * 1024 * 1024;
  if (memoryMaxSizeBytes <= 0 || localItem.sizeBytes <= 0 || localItem.sizeBytes > memoryMaxSizeBytes) {
    return;
  }

  const existedKey = randomMemoryCacheKeyByFileName.get(localItem.localCacheFileName);
  if (existedKey) {
    const existed = randomMemoryCacheMap.get(existedKey);
    if (existed) {
      existed.updatedAtMs = Date.now();
      randomMemoryCacheMap.delete(existedKey);
      randomMemoryCacheMap.set(existedKey, existed);
      return;
    }
  }

  let buffer: Buffer;
  try {
    buffer = await fs.promises.readFile(localItem.filePath);
  } catch {
    return;
  }

  const dbFile = await getFile115ByPc(localItem.pc);
  const metaFromDb = dbFile as Cloud115DbFileItem | undefined;
  const metaFromCache = await getRandomCacheMetaByPc(localItem.pc);

  const item: RandomMemoryCacheItem = {
    key: `${localItem.localCacheFileName}@${Date.now()}`,
    pc: localItem.pc,
    localCacheFileName: localItem.localCacheFileName,
    filePath: localItem.filePath,
    fileName: localItem.fileName,
    mimeType: typeof localItem.mimeType === 'string' ? localItem.mimeType : DEFAULT_MIME_TYPE,
    updatedAtMs: Date.now(),
    sizeBytes: Number(buffer.byteLength || localItem.sizeBytes || 0),
    url: localItem.url,
    buffer,
    cid: metaFromDb?.cid || metaFromCache?.cid || '',
    path: metaFromDb?.fullPath || metaFromCache?.path || '',
    parentPath:
      (metaFromDb?.fullPath ? path.posix.dirname(metaFromDb.fullPath) : '') || metaFromCache?.parentPath || '',
    liked: Boolean(metaFromDb?.isLiked ?? metaFromCache?.liked ?? false),
  };

  evictRandomMemoryCacheUntilFit(Math.max(0, memoryMaxSizeBytes - item.sizeBytes));
  if (item.sizeBytes > memoryMaxSizeBytes || getRandomMemoryCacheTotalBytes() + item.sizeBytes > memoryMaxSizeBytes) {
    return;
  }

  randomMemoryCacheMap.set(item.key, item);
  randomMemoryCacheKeyByFileName.set(item.localCacheFileName, item.key);
  addRandomMemoryCacheTotalBytes(item.sizeBytes);
};
