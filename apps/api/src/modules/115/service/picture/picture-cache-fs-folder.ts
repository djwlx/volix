import type { PicCacheFolderItem } from '@volix/types';
import fs from 'fs';
import path from 'path';
import { pipeline } from 'stream/promises';
import mime from 'mime-types';
import { AppConfigEnum } from '../../../config/model/config.model';
import { clearConfig, getConfig, setConfig } from '../../../config/service/config.service';
import { badRequest } from '../../../shared/http-handler';
import { calculateTimeDifference, waitTime } from '../../../../utils/date';
import { lightLocks } from '../../../../utils/light-lock';
import { log } from '../../../../utils/logger';
import request from '../../../../utils/request';
import type { Cloud115DbFileItem } from '../../types/115.types';
import { get115FileData } from '../file.service';
import { getFile115ByPc, setFile115LocalCacheFileNameByPc, setFile115List } from '../file-db.service';
import {
  type Cloud115FileListItem,
  DEFAULT_115_DOWNLOAD_UA,
  DEFAULT_FILE_NAME,
  DEFAULT_MIME_TYPE,
  PIC_LIKED_CACHE_DIR,
  PIC_RANDOM_CACHE_DIR,
  clearLocalRandomPicCacheByPc,
  getLocalRandomPicCacheByPc,
  getLocalRandomPicCacheFileList,
  getOriginFileNameFromLocalCacheFileName,
  getPicCacheFileName,
  getPicCacheFilePath,
  getPicCachePublicUrl,
  getRandomCacheConfig,
  getRandomPicCacheFilePath,
  likeCacheDownloadJobMap,
  parsePcFromLocalCacheFileName,
  randomCacheDownloadJobMap,
  sanitizeCacheFileName,
  setRandomCacheMetaByPc,
} from './picture-cache-random-core';
import { tryAddRandomMemoryCacheByLocalItem } from './picture-cache-memory';

export const getLocalPicCacheFileList = async () => {
  try {
    const entries = await fs.promises.readdir(PIC_LIKED_CACHE_DIR, {
      withFileTypes: true,
    });

    const result = await Promise.all(
      entries
        .filter(entry => entry.isFile())
        .map(async entry => {
          const localCacheFileName = String(entry.name || '').trim();
          const pc = parsePcFromLocalCacheFileName(localCacheFileName);
          if (!pc) {
            return undefined;
          }

          const filePath = getPicCacheFilePath(localCacheFileName);
          try {
            const stat = await fs.promises.stat(filePath);
            return {
              pc,
              localCacheFileName,
              filePath,
              fileName: getOriginFileNameFromLocalCacheFileName(localCacheFileName),
              mimeType: mime.lookup(localCacheFileName) || DEFAULT_MIME_TYPE,
              updatedAtMs: stat.mtimeMs || stat.ctimeMs || 0,
              url: getPicCachePublicUrl(pc),
            };
          } catch {
            return undefined;
          }
        })
    );

    return result.filter(item => Boolean(item)) as Array<{
      pc: string;
      localCacheFileName: string;
      filePath: string;
      fileName: string;
      mimeType: string | false;
      updatedAtMs: number;
      url: string;
    }>;
  } catch {
    return [] as Array<{
      pc: string;
      localCacheFileName: string;
      filePath: string;
      fileName: string;
      mimeType: string | false;
      updatedAtMs: number;
      url: string;
    }>;
  }
};

export const getLocalPicCacheByPcFromFs = async (pc: string) => {
  const normalizedPc = String(pc || '').trim();
  if (!normalizedPc) {
    return undefined;
  }

  const list = await getLocalPicCacheFileList();
  const candidates = list.filter(item => item.pc === normalizedPc);
  if (candidates.length === 0) {
    return undefined;
  }

  const sorted = candidates.sort((a, b) => b.updatedAtMs - a.updatedAtMs);
  return sorted[0];
};

export const clearLocalPicCacheByPcFromFs = async (pc: string) => {
  const cache = await getLocalPicCacheByPcFromFs(pc);
  if (!cache) {
    return false;
  }
  try {
    await fs.promises.unlink(cache.filePath);
    return true;
  } catch {
    return false;
  }
};

export const getLocalPicCacheByFile = async (file: { pc: string; localCacheFileName?: string }) => {
  const localCacheFileName = String(file.localCacheFileName || '').trim();
  if (!localCacheFileName) {
    return undefined;
  }

  try {
    const filePath = getPicCacheFilePath(localCacheFileName);
    await fs.promises.access(filePath, fs.constants.R_OK);

    return {
      pc: file.pc,
      filePath,
      fileName: localCacheFileName.split('.').slice(1).join('.') || DEFAULT_FILE_NAME,
      mimeType: mime.lookup(localCacheFileName) || DEFAULT_MIME_TYPE,
      url: getPicCachePublicUrl(file.pc),
    };
  } catch {
    return undefined;
  }
};

export const getLocalPicCacheByPc = async (pc: string) => {
  const file = await getFile115ByPc(pc);
  if (!file) {
    return undefined;
  }
  return getLocalPicCacheByFile({
    pc: file.pc,
    localCacheFileName: file.localCacheFileName,
  });
};

export const clearLocalPicCacheByPc = async (pc: string) => {
  const file = await getFile115ByPc(pc);
  const localCacheFileName = String(file?.localCacheFileName || '').trim();
  if (!localCacheFileName) {
    return;
  }

  try {
    await fs.promises.unlink(getPicCacheFilePath(localCacheFileName));
  } catch {
    // ignore remove error
  }

  await setFile115LocalCacheFileNameByPc(pc, null);
};

export const saveFile115List = async (dataList: Cloud115FileListItem[], cid: string, parentPath: string) => {
  const list: Cloud115DbFileItem[] = dataList.map(item => ({
    class: item.class || '',
    pc: item.pc,
    cid,
    parentCid: item.cid,
    fullPath: `${parentPath === '/' ? '' : parentPath}/${item.n}`,
    isLiked: false,
    localCacheFileName: '',
  }));

  await setFile115List(list);
};

let cacheQueueRunner: Promise<void> | null = null;
let folderConfigLock = Promise.resolve();
export const getCacheQueueRunner = () => cacheQueueRunner;
export const setCacheQueueRunner = (runner: Promise<void> | null) => {
  cacheQueueRunner = runner;
};

export const withFolderConfigLock = async <T>(task: () => Promise<T>) => {
  const run = folderConfigLock.then(task, task);
  folderConfigLock = run.then(
    () => undefined,
    () => undefined
  );
  return run;
};

export const normalizePaths = (paths?: string[]) => {
  return (paths || []).map(path => path.trim()).filter(Boolean);
};

export const normalizeFolderPaths = (paths?: string[]) => {
  return Array.from(
    new Set(
      (paths || [])
        .map(item => item.trim())
        .filter(Boolean)
        .map(item => path.posix.normalize(`/${item.replace(/^\/+/, '')}`).replace(/\/+$/, ''))
        .filter(item => item && item !== '/' && item !== '.')
    )
  );
};

export const nowIso = () => new Date().toISOString();

export const getPicCacheFolders = async (): Promise<PicCacheFolderItem[]> => {
  const config = await getConfig(AppConfigEnum.picture_115_folders);
  const raw = config?.picture_115_folders;
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw) as PicCacheFolderItem[];
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .map(item => ({
        cid: String(item.cid || '').trim(),
        status: item.status,
        errorMessage: item.errorMessage,
        updatedAt: item.updatedAt,
      }))
      .filter(item => item.cid);
  } catch (error) {
    log.error('解析 115 图片缓存目录配置失败', error);
    return [];
  }
};

export const savePicCacheFolders = async (folders: PicCacheFolderItem[]) => {
  if (folders.length === 0) {
    await clearConfig([AppConfigEnum.picture_115_folders, 'picture_115_cids' as AppConfigEnum]);
    return;
  }

  await setConfig(
    AppConfigEnum.picture_115_folders,
    JSON.stringify(
      folders.map(item => ({
        cid: item.cid,
        status: item.status,
        errorMessage: item.errorMessage,
        updatedAt: item.updatedAt,
      }))
    )
  );
};

export const parse115FileMeta = (result: unknown) => {
  const metaInfo = Object.values((result || {}) as Record<string, unknown>)[0] as
    | {
        url?: {
          url?: string;
        };
        file_name?: string;
      }
    | undefined;

  return {
    url: metaInfo?.url?.url || '',
    fileName: metaInfo?.file_name || DEFAULT_FILE_NAME,
  };
};

export const ensureLocalPicCacheByFile = async (file: Cloud115DbFileItem, userAgent: string) => {
  const cached = await getLocalPicCacheByPc(file.pc);
  if (cached) {
    return cached;
  }

  const result = await get115FileData(file.pc, userAgent);
  const { url, fileName } = parse115FileMeta(result);
  if (!url) {
    badRequest('未获取到图片下载链接');
  }

  await fs.promises.mkdir(PIC_LIKED_CACHE_DIR, { recursive: true });

  const targetFileName = getPicCacheFileName(file.pc, fileName);
  const targetPath = getPicCacheFilePath(targetFileName);
  const tempPath = `${targetPath}.tmp`;
  const mimeType = mime.lookup(fileName) || DEFAULT_MIME_TYPE;

  try {
    const response = await request.get(url, {
      responseType: 'stream',
      headers: {
        'User-Agent': userAgent || DEFAULT_115_DOWNLOAD_UA,
      },
    });

    await clearLocalPicCacheByPc(file.pc);
    await pipeline(response.data, fs.createWriteStream(tempPath));
    await fs.promises.rename(tempPath, targetPath);
    await setFile115LocalCacheFileNameByPc(file.pc, targetFileName);
  } catch (error) {
    try {
      await fs.promises.unlink(tempPath);
    } catch {
      // ignore
    }
    throw error;
  }

  return {
    pc: file.pc,
    filePath: targetPath,
    fileName: sanitizeCacheFileName(fileName),
    mimeType,
    url: getPicCachePublicUrl(file.pc),
  };
};

export const ensureLocalPicCacheByFileAsync = (file: Cloud115DbFileItem, userAgent: string) => {
  const running = likeCacheDownloadJobMap.get(file.pc);
  if (running) {
    return running;
  }

  const job = (async () => {
    try {
      await ensureLocalPicCacheByFile(file, userAgent);
      log.info('[115-liked-cache] 图片缓存完成', {
        pc: file.pc,
      });
    } catch (error) {
      log.error('[115-liked-cache] 图片缓存失败', file.pc, error);
    } finally {
      likeCacheDownloadJobMap.delete(file.pc);
    }
  })();

  likeCacheDownloadJobMap.set(file.pc, job);
  return job;
};

export const ensureRandomLocalPicCacheByFile = async (file: Cloud115DbFileItem, userAgent: string) => {
  const config = await getRandomCacheConfig();

  const existedCache = await getLocalRandomPicCacheByPc(file.pc);
  if (existedCache) {
    await tryAddRandomMemoryCacheByLocalItem(existedCache, config);
    return;
  }

  const maxSizeBytes = config.localMaxSizeMb * 1024 * 1024;
  const currentLocalList = await getLocalRandomPicCacheFileList();
  const currentLocalTotalSizeBytes = currentLocalList.reduce((acc, item) => acc + item.sizeBytes, 0);
  if (currentLocalTotalSizeBytes >= maxSizeBytes) {
    return;
  }

  const result = await get115FileData(file.pc, userAgent || DEFAULT_115_DOWNLOAD_UA);
  const { url, fileName } = parse115FileMeta(result);
  if (!url) {
    return;
  }

  await fs.promises.mkdir(PIC_RANDOM_CACHE_DIR, { recursive: true });

  const targetFileName = getPicCacheFileName(file.pc, fileName);
  const targetPath = getRandomPicCacheFilePath(targetFileName);
  const tempPath = `${targetPath}.tmp`;
  await clearLocalRandomPicCacheByPc(file.pc, targetFileName);

  try {
    const response = await request.get(url, {
      responseType: 'stream',
      headers: {
        'User-Agent': userAgent || DEFAULT_115_DOWNLOAD_UA,
      },
    });

    await pipeline(response.data, fs.createWriteStream(tempPath));
    const stat = await fs.promises.stat(tempPath);
    const tempSizeBytes = Number(stat.size || 0);
    const projectedSizeBytes = currentLocalTotalSizeBytes + tempSizeBytes;

    if (projectedSizeBytes > maxSizeBytes) {
      await fs.promises.unlink(tempPath).catch(() => undefined);
      return;
    }

    await fs.promises.rename(tempPath, targetPath);
    await setRandomCacheMetaByPc(file.pc, {
      pc: file.pc,
      cid: file.cid,
      path: file.fullPath || '',
      parentPath: file.fullPath ? path.posix.dirname(file.fullPath) : '',
      liked: Boolean(file.isLiked),
      fileName: sanitizeCacheFileName(fileName),
      mimeType: String(mime.lookup(fileName) || DEFAULT_MIME_TYPE),
      localCacheFileName: targetFileName,
      updatedAtMs: Date.now(),
    });

    const localItem = await getLocalRandomPicCacheByPc(file.pc);
    if (localItem) {
      await tryAddRandomMemoryCacheByLocalItem(localItem, config);
    }
  } catch (error) {
    await fs.promises.unlink(tempPath).catch(() => undefined);
    throw error;
  }
};

export const ensureRandomLocalPicCacheByFileAsync = (file: Cloud115DbFileItem, userAgent: string) => {
  const running = randomCacheDownloadJobMap.get(file.pc);
  if (running) {
    return running;
  }

  const job = (async () => {
    try {
      await ensureRandomLocalPicCacheByFile(file, userAgent);
    } catch (error) {
      log.error('[115-random-local-cache] 图片缓存失败', file.pc, error);
    } finally {
      randomCacheDownloadJobMap.delete(file.pc);
    }
  })();

  randomCacheDownloadJobMap.set(file.pc, job);
  return job;
};
