import path from 'path';
import { AppConfigEnum } from '../../../config/model/config.model';
import { clearConfig, setConfig } from '../../../config/service/config.service';
import { calculateTimeDifference, waitTime } from '../../../../utils/date';
import { lightLocks } from '../../../../utils/light-lock';
import { log } from '../../../../utils/logger';
import type { Cloud115DbFileItem, RandomPicMeta } from '../../types/115.types';
import { get115FileData } from '../file.service';
import { getFile115ByPc, getFile115CachedParentCidSetByRootCid } from '../file-db.service';
import { getCloud115Sdk } from '../sdk.service';
import {
  type Cloud115FileListItem,
  type RandomLocalCacheItem,
  type RandomMemoryCacheItem,
  DEFAULT_FILE_NAME,
  DEFAULT_MIME_TYPE,
  getRandomCacheMetaByPc,
  log115RandomPerf,
} from './picture-cache-random-core';
import {
  getCacheQueueRunner,
  getLocalPicCacheByFile,
  getPicCacheFolders,
  nowIso,
  parse115FileMeta,
  saveFile115List,
  savePicCacheFolders,
  setCacheQueueRunner,
  withFolderConfigLock,
} from './picture-cache-fs-folder';

export const mergeNotice = (...items: Array<string | undefined>) => {
  const list = items.map(item => String(item || '').trim()).filter(Boolean);
  return Array.from(new Set(list)).join('；');
};

export const buildRandomMetaFromRandomLocalCacheItem = async (
  item: RandomLocalCacheItem,
  notice?: string
): Promise<RandomPicMeta> => {
  const dbFile = await getFile115ByPc(item.pc);
  const safeDbFile = dbFile as Cloud115DbFileItem | undefined;
  const metaFromCache = await getRandomCacheMetaByPc(item.pc);

  return {
    url: item.url,
    fileName: metaFromCache?.fileName || item.fileName || DEFAULT_FILE_NAME,
    cid: safeDbFile?.cid || metaFromCache?.cid || '',
    pc: item.pc,
    path: safeDbFile?.fullPath || metaFromCache?.path || '',
    parentPath:
      (safeDbFile?.fullPath ? path.posix.dirname(safeDbFile.fullPath) : '') || metaFromCache?.parentPath || '',
    liked: Boolean(safeDbFile?.isLiked ?? metaFromCache?.liked ?? false),
    localCacheFilePath: item.filePath,
    localCacheMimeType: typeof item.mimeType === 'string' ? item.mimeType : DEFAULT_MIME_TYPE,
    notice,
  };
};

export const buildRandomMetaFromRandomMemoryCacheItem = (
  item: RandomMemoryCacheItem,
  notice?: string
): RandomPicMeta => {
  return {
    url: item.url,
    fileName: item.fileName || DEFAULT_FILE_NAME,
    cid: item.cid || '',
    pc: item.pc,
    path: item.path || '',
    parentPath: item.parentPath || '',
    liked: Boolean(item.liked),
    localCacheFilePath: item.filePath,
    localCacheMimeType: item.mimeType || DEFAULT_MIME_TYPE,
    notice,
  };
};

export const buildRandomPicMetaFromFile = async (
  file: Cloud115DbFileItem,
  userAgent: string,
  notice?: string
): Promise<RandomPicMeta> => {
  const startAt = Date.now();
  const localCacheStartAt = Date.now();
  const localCache = await getLocalPicCacheByFile({
    pc: file.pc,
    localCacheFileName: file.localCacheFileName,
  });
  const localCacheMs = Date.now() - localCacheStartAt;

  if (localCache) {
    const totalMs = Date.now() - startAt;
    const fileName = localCache.fileName || (file.fullPath ? path.posix.basename(file.fullPath) : DEFAULT_FILE_NAME);

    log115RandomPerf('build-meta-finished', {
      pc: file.pc,
      cid: file.cid,
      parentCid: file.parentCid,
      localCacheMs,
      source: 'local-cache',
      totalMs,
    });

    return {
      url: localCache.url,
      fileName,
      cid: file.cid,
      pc: file.pc,
      path: file.fullPath || '',
      parentPath: file.fullPath ? path.posix.dirname(file.fullPath) : '',
      liked: Boolean(file.isLiked),
      localCacheFilePath: localCache.filePath,
      localCacheMimeType: localCache.mimeType,
      notice,
    };
  }

  const fetchFileMetaStartAt = Date.now();
  const result = await get115FileData(file.pc, userAgent);
  const fetchFileMetaMs = Date.now() - fetchFileMetaStartAt;
  const { url, fileName } = parse115FileMeta(result);
  const totalMs = Date.now() - startAt;

  log115RandomPerf('build-meta-finished', {
    pc: file.pc,
    cid: file.cid,
    parentCid: file.parentCid,
    localCacheMs,
    fetchFileMetaMs,
    source: 'remote-115',
    pathSource: file.fullPath ? 'db' : 'none',
    totalMs,
  });

  return {
    url,
    fileName,
    cid: file.cid,
    pc: file.pc,
    path: file.fullPath || '',
    parentPath: file.fullPath ? path.posix.dirname(file.fullPath) : '',
    liked: Boolean(file.isLiked),
    notice,
  };
};

export const cache115PicByCid = async (cid: string) => {
  const limit = 500;
  const timer = 3000;
  const start = Date.now();
  let resultNum = 0;
  log.info('开始缓存图片目录', cid);
  const sdk = await getCloud115Sdk();
  const cachedParentCidSet = await getFile115CachedParentCidSetByRootCid(cid);

  const getPicFileList = async (currentCid: string, rootCid: string) => {
    const skipSaveForCurrentDir = cachedParentCidSet.has(currentCid);
    const result = await sdk.getFileList(0, 1, currentCid);
    const count = result.count;
    const nextCidList: string[] = [];

    for (let i = 0; i < count; i += limit) {
      const dataList: Cloud115FileListItem[] = [];
      const nowResult = await sdk.getFileList(i, limit, currentCid);
      const fileList = nowResult.data as Cloud115FileListItem[];
      const parentSegments = (nowResult.path || []).map((item: { name: string }) => item.name).filter(Boolean);
      const parentPath = `/${parentSegments.join('/')}` || '/';

      fileList.forEach(item => {
        if (item.fid && item.class === 'PIC') {
          resultNum++;
          dataList.push(item);
        }
        if (!item.fid) {
          nextCidList.push(item.cid);
        }
      });

      if (!skipSaveForCurrentDir && dataList.length > 0) {
        await saveFile115List(dataList, rootCid, parentPath);
        cachedParentCidSet.add(currentCid);
      }

      await waitTime(timer);
    }

    for (let i = 0; i < nextCidList.length; i++) {
      await getPicFileList(nextCidList[i], rootCid);
    }
  };

  await getPicFileList(cid, cid);

  const end = Date.now();
  log.info('缓存图片目录完成, cid:', cid, '耗时:', calculateTimeDifference(start, end), '数量:', resultNum);
};

export const ensure115PicQueueRunning = async () => {
  const currentRunner = getCacheQueueRunner();
  if (currentRunner) {
    return currentRunner;
  }

  const runner = (async () => {
    try {
      while (true) {
        const nextCid = await withFolderConfigLock(async () => {
          const folders = await getPicCacheFolders();
          const nextItem = folders.find(item => item.status === 'pending');
          if (!nextItem) {
            await clearConfig(AppConfigEnum.is_115_picture_caching);
            lightLocks.is115PictureCaching = false;
            return '';
          }

          nextItem.status = 'caching';
          nextItem.errorMessage = '';
          nextItem.updatedAt = nowIso();
          await savePicCacheFolders(folders);
          await setConfig(AppConfigEnum.is_115_picture_caching, 'true');
          lightLocks.is115PictureCaching = true;
          return nextItem.cid;
        });

        if (!nextCid) {
          return;
        }

        try {
          await cache115PicByCid(nextCid);
          await withFolderConfigLock(async () => {
            const folders = await getPicCacheFolders();
            const current = folders.find(item => item.cid === nextCid);
            if (current) {
              current.status = 'cached';
              current.errorMessage = '';
              current.updatedAt = nowIso();
              await savePicCacheFolders(folders);
            }
          });
        } catch (error) {
          const message = error instanceof Error ? error.message : '缓存失败';
          log.error('缓存 115 图片目录失败', nextCid, error);
          await withFolderConfigLock(async () => {
            const folders = await getPicCacheFolders();
            const current = folders.find(item => item.cid === nextCid);
            if (current) {
              current.status = 'failed';
              current.errorMessage = message;
              current.updatedAt = nowIso();
              await savePicCacheFolders(folders);
            }
          });
        }
      }
    } finally {
      setCacheQueueRunner(null);
      lightLocks.is115PictureCaching = false;
      await clearConfig(AppConfigEnum.is_115_picture_caching);
    }
  })();

  setCacheQueueRunner(runner);
  return runner;
};
