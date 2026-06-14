import type { FileListDataItem } from '@volix/types';
import fs from 'fs';
import path from 'path';
import mime from 'mime-types';
import { generateRandomNumber } from '../../../../utils/number';
import { PicRandomCacheConfig, PicRandomCacheStats } from '../../types/115.types';
import { get115OriginalCacheDir, get115RandomMetaFilePath } from './picture-cache-path';
export * from './picture-cache-random-config';

export type Cloud115FileListItem = FileListDataItem & {
  class?: string;
};

export const getFilePicCacheDir = () => get115OriginalCacheDir();
export const getLikedPicCacheDir = () => getFilePicCacheDir();
export const getRandomPicCacheDir = () => getFilePicCacheDir();
export const getRandomPicCacheMetaFile = () => get115RandomMetaFilePath();
export const DEFAULT_FILE_NAME = 'unknown.jpg';
export const DEFAULT_MIME_TYPE = 'application/octet-stream';
export const DEFAULT_115_DOWNLOAD_UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36';
export const getPicCachePublicUrl = (pc: string) => `/api/115/pic/cache/${encodeURIComponent(pc)}`;
export const getRandomPicCachePublicUrl = (cacheFileName: string) =>
  `/api/115/pic/random-cache/${encodeURIComponent(cacheFileName)}`;
export const sanitizeCacheFileName = (rawFileName: string) => {
  const safeName = path.basename(String(rawFileName || '').trim() || DEFAULT_FILE_NAME).replace(/[\\/:*?"<>|]/g, '_');

  return safeName || DEFAULT_FILE_NAME;
};
export const getPicCacheFileName = (pc: string, fileName: string) => `${pc}.${sanitizeCacheFileName(fileName)}`;
export const getPicCacheFilePath = (fileName: string) => path.join(getLikedPicCacheDir(), fileName);
export const picCacheDownloadJobMap = new Map<string, Promise<void>>();
export const likeCacheDownloadJobMap = picCacheDownloadJobMap;

export type RandomLocalCacheItem = {
  pc: string;
  localCacheFileName: string;
  filePath: string;
  fileName: string;
  mimeType: string | false;
  updatedAtMs: number;
  sizeBytes: number;
  url: string;
};

export type RandomMemoryCacheItem = {
  key: string;
  pc: string;
  localCacheFileName: string;
  filePath: string;
  fileName: string;
  mimeType: string;
  updatedAtMs: number;
  sizeBytes: number;
  url: string;
  buffer: Buffer;
  cid: string;
  path: string;
  parentPath: string;
  liked: boolean;
};

export type RandomCacheMetaRecord = {
  pc: string;
  cid: string;
  path: string;
  parentPath: string;
  liked: boolean;
  fileName: string;
  mimeType: string;
  localCacheFileName: string;
  updatedAtMs: number;
};

export const parsePcFromLocalCacheFileName = (fileName: string) => {
  const raw = String(fileName || '').trim();
  const splitIndex = raw.indexOf('.');
  if (splitIndex <= 0) {
    return '';
  }
  return raw.slice(0, splitIndex).trim();
};

export const getOriginFileNameFromLocalCacheFileName = (fileName: string) => {
  const raw = String(fileName || '').trim();
  const splitIndex = raw.indexOf('.');
  if (splitIndex <= 0 || splitIndex >= raw.length - 1) {
    return DEFAULT_FILE_NAME;
  }
  return raw.slice(splitIndex + 1) || DEFAULT_FILE_NAME;
};

export const toFixedMb = (bytes: number) => {
  return Number((bytes / (1024 * 1024)).toFixed(2));
};
export const getRandomPicCacheFilePath = (fileName: string) => {
  return path.join(getRandomPicCacheDir(), sanitizeCacheFileName(fileName));
};

export const getLocalRandomPicCacheFileList = async () => {
  const randomCacheDir = getRandomPicCacheDir();
  const randomCacheMetaFile = getRandomPicCacheMetaFile();
  try {
    const entries = await fs.promises.readdir(randomCacheDir, {
      withFileTypes: true,
    });

    const result = await Promise.all(
      entries
        .filter(entry => entry.isFile())
        .map(async entry => {
          const localCacheFileName = String(entry.name || '').trim();
          if (!localCacheFileName || localCacheFileName === path.basename(randomCacheMetaFile)) {
            return undefined;
          }
          if (localCacheFileName.endsWith('.tmp')) {
            return undefined;
          }
          const pc = parsePcFromLocalCacheFileName(localCacheFileName);
          if (!pc) {
            return undefined;
          }

          const filePath = getRandomPicCacheFilePath(localCacheFileName);
          try {
            const stat = await fs.promises.stat(filePath);
            return {
              pc,
              localCacheFileName,
              filePath,
              fileName: getOriginFileNameFromLocalCacheFileName(localCacheFileName),
              mimeType: mime.lookup(localCacheFileName) || DEFAULT_MIME_TYPE,
              updatedAtMs: stat.mtimeMs || stat.ctimeMs || 0,
              sizeBytes: Number(stat.size || 0),
              url: getRandomPicCachePublicUrl(localCacheFileName),
            };
          } catch {
            return undefined;
          }
        })
    );

    return result.filter(item => Boolean(item)) as RandomLocalCacheItem[];
  } catch {
    return [] as RandomLocalCacheItem[];
  }
};

export const randomMemoryCacheMap = new Map<string, RandomMemoryCacheItem>();
export let randomMemoryCacheTotalBytes = 0;
export const randomMemoryCacheKeyByFileName = new Map<string, string>();
export const getRandomMemoryCacheTotalBytes = () => randomMemoryCacheTotalBytes;
export const addRandomMemoryCacheTotalBytes = (deltaBytes: number) => {
  randomMemoryCacheTotalBytes += Number(deltaBytes || 0);
};

export const getRandomCacheMetaMap = async (): Promise<Record<string, RandomCacheMetaRecord>> => {
  try {
    const raw = await fs.promises.readFile(getRandomPicCacheMetaFile(), 'utf-8');
    const parsed = JSON.parse(raw) as Record<string, RandomCacheMetaRecord>;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
};

export const saveRandomCacheMetaMap = async (data: Record<string, RandomCacheMetaRecord>) => {
  await fs.promises.mkdir(getRandomPicCacheDir(), { recursive: true });
  await fs.promises.writeFile(getRandomPicCacheMetaFile(), JSON.stringify(data), 'utf-8');
};

export const setRandomCacheMetaByPc = async (pc: string, meta: RandomCacheMetaRecord) => {
  const map = await getRandomCacheMetaMap();
  map[pc] = meta;
  await saveRandomCacheMetaMap(map);
};

export const getRandomCacheMetaByPc = async (pc: string) => {
  const map = await getRandomCacheMetaMap();
  return map[pc];
};

export const pickRandomSourceByWeights = (weights: PicRandomCacheConfig['sourceWeights']) => {
  const roll = generateRandomNumber(1, 100);
  if (roll <= weights.local) {
    return 'local' as const;
  }
  return 'cloud' as const;
};

export const rebuildRandomMemoryCacheStats = () => {
  randomMemoryCacheTotalBytes = Array.from(randomMemoryCacheMap.values()).reduce(
    (acc, item) => acc + item.sizeBytes,
    0
  );
};

export const evictRandomMemoryCacheUntilFit = (maxSizeBytes: number) => {
  if (maxSizeBytes <= 0) {
    randomMemoryCacheMap.clear();
    randomMemoryCacheKeyByFileName.clear();
    randomMemoryCacheTotalBytes = 0;
    return;
  }

  const list = Array.from(randomMemoryCacheMap.values()).sort((a, b) => a.updatedAtMs - b.updatedAtMs);
  let index = 0;
  while (randomMemoryCacheTotalBytes > maxSizeBytes && index < list.length) {
    const item = list[index];
    randomMemoryCacheMap.delete(item.key);
    randomMemoryCacheKeyByFileName.delete(item.localCacheFileName);
    randomMemoryCacheTotalBytes -= item.sizeBytes;
    index++;
  }
};

export const getRandomMemoryCacheStats = (config: PicRandomCacheConfig) => {
  void config;
  return {
    memoryFileCount: 0,
    memoryTotalSizeBytes: 0,
    memoryTotalSizeMb: 0,
    memoryLimitExceeded: false,
  };
};

export const getLocalRandomCacheStats = (config: PicRandomCacheConfig, list: RandomLocalCacheItem[]) => {
  const totalSizeBytes = list.reduce((acc, item) => acc + item.sizeBytes, 0);
  const maxSizeBytes = config.localMaxSizeMb * 1024 * 1024;
  return {
    localFileCount: list.length,
    localTotalSizeBytes: totalSizeBytes,
    localTotalSizeMb: toFixedMb(totalSizeBytes),
    localLimitExceeded: totalSizeBytes > maxSizeBytes,
  };
};

export const getRandomCacheStats = (
  config: PicRandomCacheConfig,
  localList: RandomLocalCacheItem[]
): PicRandomCacheStats => {
  return {
    ...getRandomMemoryCacheStats(config),
    ...getLocalRandomCacheStats(config, localList),
  };
};

export const getRandomCacheLimitNotice = (stats: PicRandomCacheStats, config: PicRandomCacheConfig) => {
  const notices: string[] = [];
  if (stats.memoryLimitExceeded) {
    notices.push(`内存随机缓存已超上限（${stats.memoryTotalSizeMb}MB / ${config.memoryMaxSizeMb}MB）`);
  }
  if (stats.localLimitExceeded) {
    notices.push(`本地随机缓存已超上限（${stats.localTotalSizeMb}MB / ${config.localMaxSizeMb}MB）`);
  }
  return notices.join('；');
};

export const getLocalRandomPicCacheByPc = async (pc: string) => {
  const normalizedPc = String(pc || '').trim();
  if (!normalizedPc) {
    return undefined;
  }

  const list = await getLocalRandomPicCacheFileList();
  const candidates = list.filter(item => item.pc === normalizedPc);
  if (candidates.length === 0) {
    return undefined;
  }

  const sorted = candidates.sort((a, b) => b.updatedAtMs - a.updatedAtMs);
  return sorted[0];
};

export const clearLocalRandomPicCacheByPc = async (pc: string, keepFileName = '') => {
  const normalizedPc = String(pc || '').trim();
  if (!normalizedPc) {
    return;
  }

  const list = await getLocalRandomPicCacheFileList();
  const targets = list.filter(item => {
    if (item.pc !== normalizedPc) {
      return false;
    }
    if (keepFileName && item.localCacheFileName === keepFileName) {
      return false;
    }
    return true;
  });

  await Promise.all(
    targets.map(item =>
      fs.promises.unlink(item.filePath).catch(() => {
        return undefined;
      })
    )
  );

  if (!keepFileName) {
    clearRandomMemoryCacheByPc(normalizedPc);
    const meta = await getRandomCacheMetaMap();
    if (meta[normalizedPc]) {
      delete meta[normalizedPc];
      await saveRandomCacheMetaMap(meta);
    }
  }
};

export const getLocalRandomPicCacheByFileName = async (fileName: string) => {
  const safeFileName = sanitizeCacheFileName(String(fileName || '').trim());
  if (!safeFileName) {
    return undefined;
  }

  const filePath = getRandomPicCacheFilePath(safeFileName);
  try {
    const stat = await fs.promises.stat(filePath);
    if (!stat.isFile()) {
      return undefined;
    }

    return {
      pc: parsePcFromLocalCacheFileName(safeFileName),
      localCacheFileName: safeFileName,
      filePath,
      fileName: getOriginFileNameFromLocalCacheFileName(safeFileName),
      mimeType: mime.lookup(safeFileName) || DEFAULT_MIME_TYPE,
      updatedAtMs: stat.mtimeMs || stat.ctimeMs || 0,
      sizeBytes: Number(stat.size || 0),
      url: getRandomPicCachePublicUrl(safeFileName),
    };
  } catch {
    return undefined;
  }
};

export const randomCacheDownloadJobMap = picCacheDownloadJobMap;

export const getRandomMemoryCacheByFileName = (fileName: string) => {
  const key = randomMemoryCacheKeyByFileName.get(fileName);
  if (!key) {
    return undefined;
  }
  return randomMemoryCacheMap.get(key);
};

export const getRandomMemoryCacheList = () => {
  return Array.from(randomMemoryCacheMap.values());
};

export const clearRandomMemoryCacheByPc = (pc: string) => {
  const list = Array.from(randomMemoryCacheMap.values()).filter(item => item.pc === pc);
  list.forEach(item => {
    randomMemoryCacheMap.delete(item.key);
    randomMemoryCacheKeyByFileName.delete(item.localCacheFileName);
  });
  rebuildRandomMemoryCacheStats();
};
