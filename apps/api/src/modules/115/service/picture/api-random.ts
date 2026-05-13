import { badRequest } from '../../../shared/http-handler';
import { generateRandomNumber } from '../../../../utils/number';
import type { Cloud115DbFileItem, PicRandomCacheStats, RandomPicMeta } from '../../types/115.types';
import { getFile115ByCidAndParentCid, getFile115ByPc, getFile115RandomByCidList } from '../file-db.service';
import {
  evictRandomMemoryCacheUntilFit,
  getLocalRandomPicCacheFileList,
  getRandomCacheConfig,
  getRandomCacheLimitNotice,
  getRandomCacheStats,
  getRandomMemoryCacheList,
  log115RandomPerf,
  pickRandomSourceByWeights,
} from './picture-cache-random-core';
import { ensureRandomLocalPicCacheByFileAsync, getPicCacheFolders } from './picture-cache-fs-folder';
import { tryAddRandomMemoryCacheByLocalItem } from './picture-cache-memory';
import {
  buildRandomMetaFromRandomLocalCacheItem,
  buildRandomMetaFromRandomMemoryCacheItem,
  buildRandomPicMetaFromFile,
  mergeNotice,
} from './picture-cache-random-meta-queue';

export async function getRandom115PicMeta(userAgent: string): Promise<RandomPicMeta> {
  const startAt = Date.now();
  const loadConfigStartAt = Date.now();
  const [folders, randomCacheConfig, randomCacheList] = await Promise.all([
    getPicCacheFolders(),
    getRandomCacheConfig(),
    getLocalRandomPicCacheFileList(),
  ]);
  const loadConfigMs = Date.now() - loadConfigStartAt;
  const availableRootCids = folders
    .filter(item => item.status === 'cached' || item.status === 'caching')
    .map(item => item.cid);
  evictRandomMemoryCacheUntilFit(randomCacheConfig.memoryMaxSizeMb * 1024 * 1024);
  const randomCacheStats: PicRandomCacheStats = getRandomCacheStats(randomCacheConfig, randomCacheList);
  const limitNotice = getRandomCacheLimitNotice(randomCacheStats, randomCacheConfig);

  if (availableRootCids.length === 0) {
    badRequest('暂无缓存图片，请先缓存');
  }

  const selectedSource = pickRandomSourceByWeights(randomCacheConfig.sourceWeights);
  const sourceUnavailableNotice: string[] = [];

  if (selectedSource === 'memory') {
    let memoryList = getRandomMemoryCacheList();
    if (memoryList.length === 0 && randomCacheList.length > 0) {
      const seedLocalIndex = generateRandomNumber(0, randomCacheList.length - 1);
      const seedLocalItem = randomCacheList[seedLocalIndex] || randomCacheList[0];
      if (seedLocalItem) {
        await tryAddRandomMemoryCacheByLocalItem(seedLocalItem, randomCacheConfig);
      }
      memoryList = getRandomMemoryCacheList();
    }

    if (memoryList.length > 0) {
      const index = generateRandomNumber(0, memoryList.length - 1);
      const item = memoryList[index] || memoryList[0];
      if (item) {
        if (!item.cid || !availableRootCids.includes(item.cid)) {
          sourceUnavailableNotice.push('内存缓存未命中当前缓存目录，已兜底到115云');
        } else {
          const meta = buildRandomMetaFromRandomMemoryCacheItem(item, mergeNotice(limitNotice));
          log115RandomPerf('get-random-meta-finished', {
            foldersCount: folders.length,
            availableRootCidsCount: availableRootCids.length,
            targetCid: meta.cid,
            targetPc: meta.pc,
            loadConfigMs,
            source: 'memory-cache',
            randomCacheMemoryCount: randomCacheStats.memoryFileCount,
            randomCacheLocalCount: randomCacheStats.localFileCount,
            totalMs: Date.now() - startAt,
          });
          return meta;
        }
      }
    }
    sourceUnavailableNotice.push('内存缓存为空，已兜底到115云');
  }

  if (selectedSource === 'local') {
    if (randomCacheList.length > 0) {
      const index = generateRandomNumber(0, randomCacheList.length - 1);
      const localItem = randomCacheList[index] || randomCacheList[0];
      if (localItem) {
        const dbFile = await getFile115ByPc(localItem.pc);
        const safeDbFile = dbFile as Cloud115DbFileItem | undefined;
        if (!safeDbFile?.cid || !availableRootCids.includes(safeDbFile.cid)) {
          sourceUnavailableNotice.push('本地缓存未命中当前缓存目录，已兜底到115云');
        } else {
          await tryAddRandomMemoryCacheByLocalItem(localItem, randomCacheConfig);
          const meta = await buildRandomMetaFromRandomLocalCacheItem(localItem, mergeNotice(limitNotice));
          log115RandomPerf('get-random-meta-finished', {
            foldersCount: folders.length,
            availableRootCidsCount: availableRootCids.length,
            targetCid: meta.cid,
            targetPc: meta.pc,
            loadConfigMs,
            source: 'local-file-cache',
            randomCacheMemoryCount: randomCacheStats.memoryFileCount,
            randomCacheLocalCount: randomCacheStats.localFileCount,
            totalMs: Date.now() - startAt,
          });
          return meta;
        }
      }
    }
    sourceUnavailableNotice.push('本地文件缓存为空，已兜底到115云');
  }

  const pickFileStartAt = Date.now();
  const selectedFile =
    (await getFile115RandomByCidList(availableRootCids)) || badRequest('暂无可用缓存图片，请稍后重试');
  const pickFileMs = Date.now() - pickFileStartAt;
  const buildMetaStartAt = Date.now();
  const meta = await buildRandomPicMetaFromFile(selectedFile, userAgent);
  const buildMetaMs = Date.now() - buildMetaStartAt;
  const mergedNotice = mergeNotice(meta.notice, limitNotice);

  void ensureRandomLocalPicCacheByFileAsync(selectedFile, userAgent);

  log115RandomPerf('get-random-meta-finished', {
    foldersCount: folders.length,
    availableRootCidsCount: availableRootCids.length,
    targetCid: selectedFile.cid,
    targetParentCid: selectedFile.parentCid,
    targetPc: selectedFile.pc,
    loadConfigMs,
    pickFileMs,
    buildMetaMs,
    source: selectedSource === 'cloud' ? 'cloud-115' : `${selectedSource}-fallback-cloud-115`,
    randomCacheMemoryCount: randomCacheStats.memoryFileCount,
    randomCacheMemorySizeMb: randomCacheStats.memoryTotalSizeMb,
    randomCacheLocalCount: randomCacheStats.localFileCount,
    randomCacheLocalSizeMb: randomCacheStats.localTotalSizeMb,
    totalMs: Date.now() - startAt,
  });

  return {
    ...meta,
    notice: mergedNotice || undefined,
  };
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
