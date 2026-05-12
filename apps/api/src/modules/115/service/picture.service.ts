import type {
  ClearPicInfoParams,
  FileListDataItem,
  Like115PicParams,
  PicCacheFolderItem,
  PicInfoParams,
  RetryPicInfoParams,
} from '@volix/types';
import fs from 'fs';
import path from 'path';
import { pipeline } from 'stream/promises';
import mime from 'mime-types';
import { AppConfigEnum } from '../../config/model/config.model';
import { clearConfig, getConfig, setConfig } from '../../config/service/config.service';
import { badRequest } from '../../shared/http-handler';
import { calculateTimeDifference, waitTime } from '../../../utils/date';
import { lightLocks } from '../../../utils/light-lock';
import { log } from '../../../utils/logger';
import { generateRandomNumber } from '../../../utils/number';
import { PATH } from '../../../utils/path';
import request from '../../../utils/request';
import { Cloud115DbFileItem, RandomPicMeta } from '../types/115.types';
import { get115FileData, get115FileListData } from './file.service';
import {
  clearAllFile115,
  clearFile115ByCidList,
  getFile115ByCidAndParentCid,
  getFile115CachedCidList,
  getFile115PathByPc,
  getFile115ByPc,
  getFile115CountByCid,
  getFile115Len,
  getFile115RandomByCidList,
  getLikedFile115Count,
  getLikedFile115List,
  setFile115LocalCacheFileNameByPc,
  setFile115LikedByPc,
  setFile115List,
} from './file-db.service';
import { getCloud115Sdk } from './sdk.service';

type Cloud115FileListItem = FileListDataItem & {
  class?: string;
};

const log115RandomPerf = (message: string, extra: Record<string, unknown>) => {
  log.info(`[115-random-perf] ${message}`, extra);
};

const PIC_LIKED_CACHE_DIR = PATH.upload;
const DEFAULT_FILE_NAME = 'unknown.jpg';
const DEFAULT_MIME_TYPE = 'application/octet-stream';
const DEFAULT_115_DOWNLOAD_UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36';
const getPicCachePublicUrl = (pc: string) => `/api/115/pic/cache/${encodeURIComponent(pc)}`;
const sanitizeCacheFileName = (rawFileName: string) => {
  const safeName = path.basename(String(rawFileName || '').trim() || DEFAULT_FILE_NAME).replace(/[\\/:*?"<>|]/g, '_');

  return safeName || DEFAULT_FILE_NAME;
};
const getPicCacheFileName = (pc: string, fileName: string) => `${pc}.${sanitizeCacheFileName(fileName)}`;
const getPicCacheFilePath = (fileName: string) => path.join(PIC_LIKED_CACHE_DIR, fileName);
const likeCacheDownloadJobMap = new Map<string, Promise<void>>();

const getLocalPicCacheByFile = async (file: { pc: string; localCacheFileName?: string }) => {
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

const getLocalPicCacheByPc = async (pc: string) => {
  const file = await getFile115ByPc(pc);
  if (!file) {
    return undefined;
  }
  return getLocalPicCacheByFile({
    pc: file.pc,
    localCacheFileName: file.localCacheFileName,
  });
};

const clearLocalPicCacheByPc = async (pc: string) => {
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

const saveFile115List = async (dataList: Cloud115FileListItem[], cid: string, parentPath: string) => {
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

const withFolderConfigLock = async <T>(task: () => Promise<T>) => {
  const run = folderConfigLock.then(task, task);
  folderConfigLock = run.then(
    () => undefined,
    () => undefined
  );
  return run;
};

const normalizePaths = (paths?: string[]) => {
  return (paths || []).map(path => path.trim()).filter(Boolean);
};

const nowIso = () => new Date().toISOString();

const getPicCacheFolders = async (): Promise<PicCacheFolderItem[]> => {
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

const savePicCacheFolders = async (folders: PicCacheFolderItem[]) => {
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

const parse115FileMeta = (result: unknown) => {
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

const ensureLocalPicCacheByFile = async (file: Cloud115DbFileItem, userAgent: string) => {
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

const ensureLocalPicCacheByFileAsync = (file: Cloud115DbFileItem, userAgent: string) => {
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

const buildRandomPicMetaFromFile = async (
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

const cache115PicByCid = async (cid: string) => {
  const limit = 500;
  const timer = 3000;
  const start = Date.now();
  let resultNum = 0;
  log.info('开始缓存图片目录', cid);
  const sdk = await getCloud115Sdk();

  const getPicFileList = async (currentCid: string, rootCid: string) => {
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

      if (dataList.length > 0) {
        await saveFile115List(dataList, rootCid, parentPath);
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

const ensure115PicQueueRunning = async () => {
  if (cacheQueueRunner) {
    return cacheQueueRunner;
  }

  cacheQueueRunner = (async () => {
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
      cacheQueueRunner = null;
      lightLocks.is115PictureCaching = false;
      await clearConfig(AppConfigEnum.is_115_picture_caching);
    }
  })();

  return cacheQueueRunner;
};

export async function getRandom115PicMeta(userAgent: string): Promise<RandomPicMeta> {
  const startAt = Date.now();
  const loadConfigStartAt = Date.now();
  const folders = await getPicCacheFolders();
  const loadConfigMs = Date.now() - loadConfigStartAt;
  const availableRootCids = folders
    .filter(item => item.status === 'cached' || item.status === 'caching')
    .map(item => item.cid);

  if (availableRootCids.length === 0) {
    badRequest('暂无缓存图片，请先缓存');
  }

  const pickFileStartAt = Date.now();
  const selectedFile =
    (await getFile115RandomByCidList(availableRootCids)) || badRequest('暂无可用缓存图片，请稍后重试');
  const pickFileMs = Date.now() - pickFileStartAt;
  const buildMetaStartAt = Date.now();
  const meta = await buildRandomPicMetaFromFile(selectedFile, userAgent);
  const buildMetaMs = Date.now() - buildMetaStartAt;

  log115RandomPerf('get-random-meta-finished', {
    foldersCount: folders.length,
    availableRootCidsCount: availableRootCids.length,
    targetCid: selectedFile.cid,
    targetParentCid: selectedFile.parentCid,
    targetPc: selectedFile.pc,
    loadConfigMs,
    pickFileMs,
    buildMetaMs,
    totalMs: Date.now() - startAt,
  });

  return meta;
}

export async function getRandom115PicFromParentMeta(params: { pc: string; userAgent: string }): Promise<RandomPicMeta> {
  const pc = params.pc.trim();
  if (!pc) {
    badRequest('缺少图片参数');
  }

  const currentFile = await getFile115ByPc(pc);
  if (!currentFile) {
    badRequest('未找到当前图片');
  }
  const safeCurrentFile = currentFile as Cloud115DbFileItem;

  const sameFolderFiles = await getFile115ByCidAndParentCid(
    safeCurrentFile.cid,
    safeCurrentFile.parentCid || safeCurrentFile.cid
  );
  const siblingFiles = sameFolderFiles.filter(item => item.pc !== safeCurrentFile.pc);

  if (siblingFiles.length === 0) {
    return buildRandomPicMetaFromFile(safeCurrentFile, params.userAgent, '当前目录没有其他图片可切换');
  }

  const nextIndex = generateRandomNumber(0, siblingFiles.length - 1);
  const nextFile = siblingFiles[nextIndex] || siblingFiles[0] || badRequest('当前目录没有可用图片');
  return buildRandomPicMetaFromFile(nextFile, params.userAgent);
}

export async function get115PicInfoData() {
  const [picConfig, folders, cidCountMap, count, cachedCids, likedCount] = await Promise.all([
    getConfig(AppConfigEnum.is_115_picture_caching),
    getPicCacheFolders(),
    getFile115CountByCid(),
    getFile115Len(),
    getFile115CachedCidList(),
    getLikedFile115Count(),
  ]);

  return {
    count,
    likedCount,
    folders: folders.map(item => ({
      ...item,
      count: cidCountMap[item.cid] || 0,
    })),
    loading: picConfig?.is_115_picture_caching === 'true',
    cachedCids,
  };
}

export async function set115PicInfoData(params: PicInfoParams) {
  const normalizedPaths = normalizePaths(params.paths);
  if (normalizedPaths.length === 0) {
    badRequest('参数错误');
  }

  await withFolderConfigLock(async () => {
    const folders = await getPicCacheFolders();
    const folderMap = new Map(folders.map(item => [item.cid, item]));

    normalizedPaths.forEach(cid => {
      if (folderMap.has(cid)) {
        return;
      }

      folders.push({
        cid,
        status: 'pending',
        updatedAt: nowIso(),
      });
    });

    await savePicCacheFolders(folders);
  });

  void ensure115PicQueueRunning();
  return get115PicInfoData();
}

export async function clear115PicData(params?: ClearPicInfoParams) {
  const normalizedPaths = normalizePaths(params?.paths);
  if (normalizedPaths.length === 0) {
    if (lightLocks.is115PictureCaching) {
      badRequest('正在缓存中，请稍后再试');
    }
    await clearAllFile115();
    await clearConfig([
      AppConfigEnum.is_115_picture_caching,
      AppConfigEnum.picture_115_folders,
      'picture_115_cids' as AppConfigEnum,
    ]);
    lightLocks.is115PictureCaching = false;
    return 'success';
  }

  await withFolderConfigLock(async () => {
    const folders = await getPicCacheFolders();
    const activeFolders = folders.filter(
      item => normalizedPaths.includes(item.cid) && (item.status === 'pending' || item.status === 'caching')
    );
    if (activeFolders.length > 0) {
      badRequest('请等待该缓存任务完成后再删除');
    }

    const remainFolders = folders.filter(item => !normalizedPaths.includes(item.cid));
    await clearFile115ByCidList(normalizedPaths);
    await savePicCacheFolders(remainFolders);
  });

  return get115PicInfoData();
}

export async function retry115PicData(params: RetryPicInfoParams) {
  const normalizedPaths = normalizePaths(params.paths);
  if (normalizedPaths.length === 0) {
    badRequest('参数错误');
  }

  await withFolderConfigLock(async () => {
    const folders = await getPicCacheFolders();
    let changed = false;

    folders.forEach(item => {
      if (normalizedPaths.includes(item.cid) && item.status === 'failed') {
        item.status = 'pending';
        item.errorMessage = '';
        item.updatedAt = nowIso();
        changed = true;
      }
    });

    if (!changed) {
      badRequest('未找到可重试的缓存目录');
    }

    await savePicCacheFolders(folders);
  });

  void ensure115PicQueueRunning();
  return get115PicInfoData();
}

export async function like115PicData(params: Like115PicParams, userAgent: string) {
  const pc = params.pc?.trim() || '';
  if (!pc) {
    badRequest('缺少图片参数');
  }

  const file = await getFile115ByPc(pc);
  if (!file) {
    badRequest('未找到当前图片');
  }
  const safeFile = file as Cloud115DbFileItem;

  const targetLiked = typeof params.liked === 'boolean' ? params.liked : !Boolean(safeFile.isLiked);
  const localCache = targetLiked ? await getLocalPicCacheByPc(pc) : undefined;

  if (targetLiked !== Boolean(safeFile.isLiked)) {
    await setFile115LikedByPc(pc, targetLiked);
  }

  if (targetLiked) {
    if (!localCache) {
      void ensureLocalPicCacheByFileAsync(safeFile, userAgent);
    }
  } else {
    void clearLocalPicCacheByPc(pc);
  }

  return {
    pc: safeFile.pc,
    cid: safeFile.cid,
    liked: targetLiked,
    path: safeFile.fullPath || '',
    parentPath: safeFile.fullPath ? path.posix.dirname(safeFile.fullPath) : '',
    url: targetLiked ? localCache?.url || '' : '',
    cached: targetLiked ? Boolean(localCache) : false,
  };
}

export async function getLiked115PicListData(params?: { offset?: number; pageSize?: number }, userAgent = '') {
  const offset = Math.max(0, Number(params?.offset || 0));
  const pageSize = Math.min(200, Math.max(1, Number(params?.pageSize || 50)));
  const [count, list] = await Promise.all([getLikedFile115Count(), getLikedFile115List(offset, pageSize)]);
  const data = await Promise.all(
    list.map(async item => {
      const cache = await getLocalPicCacheByFile({
        pc: item.pc,
        localCacheFileName: item.localCacheFileName,
      });

      if (!cache && item.isLiked) {
        void ensureLocalPicCacheByFileAsync(item, userAgent);
      }

      return {
        pc: item.pc,
        cid: item.cid,
        path: item.fullPath || '',
        parentPath: item.fullPath ? path.posix.dirname(item.fullPath) : '',
        fileName: cache?.fileName || (item.fullPath ? path.posix.basename(item.fullPath) : ''),
        liked: Boolean(item.isLiked),
        cached: Boolean(cache),
        url: getPicCachePublicUrl(item.pc),
      };
    })
  );

  return {
    count,
    data,
    offset,
    pageSize,
  };
}

export async function get115PicPathByPcData(pc: string) {
  const normalizedPc = String(pc || '').trim();
  if (!normalizedPc) {
    badRequest('缺少图片参数');
  }

  const info = await getFile115PathByPc(normalizedPc);
  if (!info) {
    badRequest('未找到缓存路径');
  }
  const safeInfo = info as NonNullable<typeof info>;

  return {
    pc: safeInfo.pc,
    cid: safeInfo.cid,
    parentPath: safeInfo.fullPath ? path.posix.dirname(safeInfo.fullPath) : '',
    path: safeInfo.fullPath,
    liked: Boolean(safeInfo.isLiked),
    cached: Boolean(await getLocalPicCacheByPc(safeInfo.pc)),
  };
}

export async function get115PicCacheFileByPcData(pc: string, userAgent = '') {
  const normalizedPc = String(pc || '').trim();
  if (!normalizedPc) {
    badRequest('缺少图片参数');
  }

  const file = await getFile115ByPc(normalizedPc);
  if (!file) {
    badRequest('未找到当前图片');
  }
  const safeFile = file as Cloud115DbFileItem;

  const cache = await getLocalPicCacheByFile({
    pc: safeFile.pc,
    localCacheFileName: safeFile.localCacheFileName,
  });
  if (cache) {
    return {
      kind: 'local' as const,
      ...cache,
    };
  }

  if (safeFile.isLiked) {
    void ensureLocalPicCacheByFileAsync(safeFile, userAgent);
  }

  const meta = parse115FileMeta(await get115FileData(safeFile.pc, userAgent || DEFAULT_115_DOWNLOAD_UA));
  if (!meta.url) {
    badRequest('图片地址获取失败');
  }

  return {
    kind: 'remote' as const,
    pc: safeFile.pc,
    url: meta.url,
    fileName: meta.fileName || (safeFile.fullPath ? path.posix.basename(safeFile.fullPath) : DEFAULT_FILE_NAME),
    mimeType: mime.lookup(meta.fileName || '') || DEFAULT_MIME_TYPE,
  };
}
