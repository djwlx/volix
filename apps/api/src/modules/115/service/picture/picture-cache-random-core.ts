import type { FileListDataItem, SetPicRandomCacheConfigParams } from '@volix/types';
import fs from 'fs';
import path from 'path';
import mime from 'mime-types';
import { AppConfigEnum } from '../../../config/model/config.model';
import { getConfig, setConfig } from '../../../config/service/config.service';
import { generateRandomNumber } from '../../../../utils/number';
import { PATH } from '../../../../utils/path';
import { getRequestActingUserId } from '../../../../utils/request-context';
import { PicRandomCacheConfig, PicRandomCacheStats } from '../../types/115.types';

export type Cloud115FileListItem = FileListDataItem & {
  class?: string;
};

const get115ScopeDirName = () => String(getRequestActingUserId() || 'public').replace(/[^\w.-]/g, '_');
export const getLikedPicCacheDir = () => path.join(PATH.cache, '115-liked-picture', get115ScopeDirName());
export const getRandomPicCacheDir = () => path.join(PATH.cache, '115-random-picture', get115ScopeDirName());
export const getRandomPicCacheMetaFile = () => path.join(getRandomPicCacheDir(), 'meta.random-picture.json');
export const DEFAULT_FILE_NAME = 'unknown.jpg';
export const DEFAULT_MIME_TYPE = 'application/octet-stream';
export const DEFAULT_RANDOM_CACHE_CONFIG: PicRandomCacheConfig = {
  sourceWeights: {
    memory: 0,
    local: 50,
    cloud: 50,
  },
  memoryMaxSizeMb: 100,
  localMaxSizeMb: 2048,
  randomNoRepeatWindowMinutes: 5,
  randomNoRepeatMaxCount: 50,
};
export const MIN_RANDOM_CACHE_SIZE_MB = 100;
export const MAX_RANDOM_CACHE_SIZE_MB = 102400;
export const MIN_RANDOM_NO_REPEAT_WINDOW_MINUTES = 0;
export const MAX_RANDOM_NO_REPEAT_WINDOW_MINUTES = 24 * 60;
export const MIN_RANDOM_NO_REPEAT_MAX_COUNT = 1;
export const MAX_RANDOM_NO_REPEAT_MAX_COUNT = 10000;
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
export const likeCacheDownloadJobMap = new Map<string, Promise<void>>();

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

export const normalizeRandomCacheConfig = (input?: Partial<PicRandomCacheConfig> | null): PicRandomCacheConfig => {
  const safeInput = input || {};
  const sourceLocalRaw = Number(safeInput?.sourceWeights?.local ?? DEFAULT_RANDOM_CACHE_CONFIG.sourceWeights.local);
  const sourceCloudRaw = Number(safeInput?.sourceWeights?.cloud ?? DEFAULT_RANDOM_CACHE_CONFIG.sourceWeights.cloud);
  const sourceMemoryRaw = Number(safeInput?.sourceWeights?.memory ?? DEFAULT_RANDOM_CACHE_CONFIG.sourceWeights.memory);
  const memoryRaw =
    typeof safeInput?.memoryMaxSizeMb === 'number' && Number.isFinite(safeInput.memoryMaxSizeMb)
      ? safeInput.memoryMaxSizeMb
      : DEFAULT_RANDOM_CACHE_CONFIG.memoryMaxSizeMb;
  const localRaw =
    typeof safeInput?.localMaxSizeMb === 'number' && Number.isFinite(safeInput.localMaxSizeMb)
      ? safeInput.localMaxSizeMb
      : DEFAULT_RANDOM_CACHE_CONFIG.localMaxSizeMb;
  const randomNoRepeatWindowMinutesRaw =
    typeof safeInput?.randomNoRepeatWindowMinutes === 'number' && Number.isFinite(safeInput.randomNoRepeatWindowMinutes)
      ? safeInput.randomNoRepeatWindowMinutes
      : DEFAULT_RANDOM_CACHE_CONFIG.randomNoRepeatWindowMinutes;
  const randomNoRepeatMaxCountRaw =
    typeof safeInput?.randomNoRepeatMaxCount === 'number' && Number.isFinite(safeInput.randomNoRepeatMaxCount)
      ? safeInput.randomNoRepeatMaxCount
      : DEFAULT_RANDOM_CACHE_CONFIG.randomNoRepeatMaxCount;

  // Memory random cache is removed. Keep old payloads compatible by redistributing
  // local/cloud weights to sum 100 while forcing memory to 0.
  const safeMemoryWeight = Math.max(0, Math.round(Number.isFinite(sourceMemoryRaw) ? sourceMemoryRaw : 0));
  const safeLocalWeight = Math.max(0, Math.round(Number.isFinite(sourceLocalRaw) ? sourceLocalRaw : 0));
  const safeCloudWeight = Math.max(0, Math.round(Number.isFinite(sourceCloudRaw) ? sourceCloudRaw : 0));
  const localAndCloudTotal = safeLocalWeight + safeCloudWeight;
  const fallbackCloudWeight = safeCloudWeight + safeMemoryWeight;

  const normalizedWeights =
    localAndCloudTotal > 0
      ? {
          memory: 0,
          local: Math.round((safeLocalWeight / localAndCloudTotal) * 100),
          cloud: 0,
        }
      : {
          memory: 0,
          local: 50,
          cloud: 50,
        };

  normalizedWeights.cloud = 100 - normalizedWeights.local;
  if (localAndCloudTotal === 0 && fallbackCloudWeight > 0) {
    normalizedWeights.local = 0;
    normalizedWeights.cloud = 100;
  }

  return {
    sourceWeights: normalizedWeights,
    memoryMaxSizeMb: Math.min(MAX_RANDOM_CACHE_SIZE_MB, Math.max(MIN_RANDOM_CACHE_SIZE_MB, Math.round(memoryRaw))),
    localMaxSizeMb: Math.min(MAX_RANDOM_CACHE_SIZE_MB, Math.max(MIN_RANDOM_CACHE_SIZE_MB, Math.round(localRaw))),
    randomNoRepeatWindowMinutes: Math.min(
      MAX_RANDOM_NO_REPEAT_WINDOW_MINUTES,
      Math.max(MIN_RANDOM_NO_REPEAT_WINDOW_MINUTES, Math.round(randomNoRepeatWindowMinutesRaw))
    ),
    randomNoRepeatMaxCount: Math.min(
      MAX_RANDOM_NO_REPEAT_MAX_COUNT,
      Math.max(MIN_RANDOM_NO_REPEAT_MAX_COUNT, Math.round(randomNoRepeatMaxCountRaw))
    ),
  };
};

export const parseRandomCacheConfig = (raw?: string | null) => {
  if (!raw) {
    return DEFAULT_RANDOM_CACHE_CONFIG;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<PicRandomCacheConfig>;
    return normalizeRandomCacheConfig(parsed);
  } catch {
    return DEFAULT_RANDOM_CACHE_CONFIG;
  }
};

export const getRandomCacheConfig = async (): Promise<PicRandomCacheConfig> => {
  const config = await getConfig(AppConfigEnum.picture_115_random_weights);
  return parseRandomCacheConfig(config?.picture_115_random_weights || '');
};

export const setRandomCacheConfig = async (params: SetPicRandomCacheConfigParams) => {
  const current = await getRandomCacheConfig();
  const nextWeightsRaw = {
    memory: Number(params?.sourceWeights?.memory ?? 0),
    local: Number(params?.sourceWeights?.local ?? current.sourceWeights.local),
    cloud: Number(params?.sourceWeights?.cloud ?? current.sourceWeights.cloud),
  };

  const next = normalizeRandomCacheConfig({
    sourceWeights: nextWeightsRaw,
    memoryMaxSizeMb: typeof params.memoryMaxSizeMb === 'number' ? params.memoryMaxSizeMb : current.memoryMaxSizeMb,
    localMaxSizeMb: typeof params.localMaxSizeMb === 'number' ? params.localMaxSizeMb : current.localMaxSizeMb,
    randomNoRepeatWindowMinutes:
      typeof params.randomNoRepeatWindowMinutes === 'number'
        ? params.randomNoRepeatWindowMinutes
        : current.randomNoRepeatWindowMinutes,
    randomNoRepeatMaxCount:
      typeof params.randomNoRepeatMaxCount === 'number'
        ? params.randomNoRepeatMaxCount
        : current.randomNoRepeatMaxCount,
  });

  await setConfig(AppConfigEnum.picture_115_random_weights, JSON.stringify(next));
  return next;
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

export const randomCacheDownloadJobMap = new Map<string, Promise<void>>();

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
