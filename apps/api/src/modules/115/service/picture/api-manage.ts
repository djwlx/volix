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
  getLikedFile115Count,
  getFile115RootCidListByCidList,
  getFile115RootCidListByFolderPathList,
} from '../file-db.service';
import {
  getLocalRandomPicCacheFileList,
  getRandomCacheConfig,
  getRandomCacheStats,
  toFixedMb,
  setRandomCacheConfig,
} from './picture-cache-random-core';
import { ensureUnifiedPicCacheWithinLimit, getUnifiedPicCacheUsage } from './picture-cache-unified';
import {
  getPicCacheFolders,
  normalizeFolderPaths,
  normalizePaths,
  nowIso,
  savePicCacheFolders,
  withFolderConfigLock,
} from './picture-cache-fs-folder';
import { ensure115PicQueueRunning } from './picture-cache-random-meta-queue';
import { t } from '../../../../utils/i18n';

export async function get115PicInfoData() {
  const [picConfig, folders, cidCountMap, count, cachedCids, cachedFolderPaths, likedCount, randomCacheConfig] =
    await Promise.all([
      getConfig(AppConfigEnum.is_115_picture_caching),
      getPicCacheFolders(),
      getFile115CountByCid(),
      getFile115Len(),
      getFile115CachedCidList(),
      getFile115CachedFolderPathList(),
      getLikedFile115Count(),
      getRandomCacheConfig(),
    ]);
  await ensureUnifiedPicCacheWithinLimit({
    maxSizeBytes: randomCacheConfig.localMaxSizeMb * 1024 * 1024,
    wait: true,
  });
  const [randomCacheList, unifiedUsage] = await Promise.all([
    getLocalRandomPicCacheFileList(),
    getUnifiedPicCacheUsage(),
  ]);
  const randomCacheStats: PicRandomCacheStats = getRandomCacheStats(randomCacheConfig, randomCacheList);
  const unifiedRandomCacheStats: PicRandomCacheStats = {
    ...randomCacheStats,
    localFileCount: unifiedUsage.totalFileCount,
    localTotalSizeBytes: unifiedUsage.totalSizeBytes,
    localTotalSizeMb: toFixedMb(unifiedUsage.totalSizeBytes),
    localLimitExceeded: unifiedUsage.totalSizeBytes > randomCacheConfig.localMaxSizeMb * 1024 * 1024,
  };

  return {
    count,
    likedCount,
    folders: folders.map(item => ({
      ...item,
      count: cidCountMap[item.cid] || 0,
    })),
    loading: picConfig?.is_115_picture_caching === 'true',
    cachedCids,
    cachedFolderPaths,
    randomCacheConfig,
    randomCacheStats: unifiedRandomCacheStats,
  };
}

export async function set115PicInfoData(params: PicInfoParams) {
  const normalizedPaths = normalizePaths(params.paths);
  if (normalizedPaths.length === 0) {
    badRequest(t('common.validation.invalidParams'));
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
      badRequest(t('pic115Api.cachingInProgress'));
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
      badRequest(t('pic115Api.waitForCacheCompletion'));
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
    badRequest(t('common.validation.invalidParams'));
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
      badRequest(t('pic115Api.retryTargetNotFound'));
    }

    await savePicCacheFolders(folders);
  });

  void ensure115PicQueueRunning();
  return get115PicInfoData();
}
