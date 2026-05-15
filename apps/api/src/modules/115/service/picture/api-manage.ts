import type {
  ClearPicInfoParams,
  PicInfoParams,
  RetryPicInfoParams,
  SetPicRandomCacheConfigParams,
} from '@volix/types';
import { AppConfigEnum } from '../../../config/model/config.model';
import { clearConfig, getConfig } from '../../../config/service/config.service';
import { badRequest } from '../../../shared/http-handler';
import { lightLocks } from '../../../../utils/light-lock';
import type { PicRandomCacheStats } from '../../types/115.types';
import {
  clearAllFile115,
  clearFile115ByCidList,
  clearFile115ByFolderPathList,
  getFile115CachedCidList,
  getFile115CachedFolderPathList,
  getFile115CountByCid,
  getFile115Len,
  getFile115RootCidListByCidList,
  getFile115RootCidListByFolderPathList,
} from '../file-db.service';
import {
  getLocalRandomPicCacheFileList,
  getRandomCacheConfig,
  getRandomCacheStats,
  setRandomCacheConfig,
} from './picture-cache-random-core';
import {
  getLocalPicCacheFileList,
  getPicCacheFolders,
  normalizeFolderPaths,
  normalizePaths,
  nowIso,
  savePicCacheFolders,
  withFolderConfigLock,
} from './picture-cache-fs-folder';
import { ensure115PicQueueRunning } from './picture-cache-random-meta-queue';

export async function get115PicInfoData() {
  const [
    picConfig,
    folders,
    cidCountMap,
    count,
    cachedCids,
    cachedFolderPaths,
    localCacheList,
    randomCacheConfig,
    randomCacheList,
  ] = await Promise.all([
    getConfig(AppConfigEnum.is_115_picture_caching),
    getPicCacheFolders(),
    getFile115CountByCid(),
    getFile115Len(),
    getFile115CachedCidList(),
    getFile115CachedFolderPathList(),
    getLocalPicCacheFileList(),
    getRandomCacheConfig(),
    getLocalRandomPicCacheFileList(),
  ]);
  const randomCacheStats: PicRandomCacheStats = getRandomCacheStats(randomCacheConfig, randomCacheList);

  return {
    count,
    likedCount: localCacheList.length,
    folders: folders.map(item => ({
      ...item,
      count: cidCountMap[item.cid] || 0,
    })),
    loading: picConfig?.is_115_picture_caching === 'true',
    cachedCids,
    cachedFolderPaths,
    randomCacheConfig,
    randomCacheStats,
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
      const existing = folderMap.get(cid);
      if (existing) {
        if (existing.status === 'partial' || existing.status === 'failed') {
          existing.status = 'pending';
          existing.errorMessage = '';
          existing.updatedAt = nowIso();
        }
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

export async function set115PicRandomCacheConfigData(params: SetPicRandomCacheConfigParams) {
  await setRandomCacheConfig(params);
  return get115PicInfoData();
}

export async function clear115PicData(params?: ClearPicInfoParams) {
  const normalizedInputPaths = normalizePaths(params?.paths);
  const normalizedCidList = normalizedInputPaths.filter(item => !item.includes('/'));
  const normalizedFolderPathList = normalizeFolderPaths([
    ...(params?.folderPaths || []),
    ...normalizedInputPaths.filter(item => item.includes('/')),
  ]);

  if (normalizedCidList.length === 0 && normalizedFolderPathList.length === 0) {
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

  const [affectedRootCidListByCid, affectedRootCidListByFolderPath] = await Promise.all([
    normalizedCidList.length > 0 ? getFile115RootCidListByCidList(normalizedCidList) : [],
    normalizedFolderPathList.length > 0 ? getFile115RootCidListByFolderPathList(normalizedFolderPathList) : [],
  ]);

  await withFolderConfigLock(async () => {
    const folders = await getPicCacheFolders();
    const blockedCidSet = new Set([
      ...normalizedCidList,
      ...affectedRootCidListByCid,
      ...affectedRootCidListByFolderPath,
    ]);
    const activeFolders = folders.filter(
      item => blockedCidSet.has(item.cid) && (item.status === 'pending' || item.status === 'caching')
    );
    if (activeFolders.length > 0) {
      badRequest('请等待该缓存任务完成后再删除');
    }

    const remainFolders = folders.filter(item => !normalizedCidList.includes(item.cid));
    if (normalizedCidList.length > 0) {
      await clearFile115ByCidList(normalizedCidList);
    }
    if (normalizedFolderPathList.length > 0) {
      await clearFile115ByFolderPathList(normalizedFolderPathList);
    }

    const affectedRootCidSet = new Set([...affectedRootCidListByCid, ...affectedRootCidListByFolderPath]);
    remainFolders.forEach(item => {
      if (!affectedRootCidSet.has(item.cid)) {
        return;
      }
      if (item.status === 'cached') {
        item.status = 'partial';
        item.updatedAt = nowIso();
      }
    });

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
