import { badRequest } from '../../../shared/http-handler';
import { log } from '../../../../utils/logger';
import { generateRandomNumber } from '../../../../utils/number';
import type { Cloud115DbFileItem, PicRandomCacheStats, RandomPicMeta } from '../../types/115.types';
import {
  getFile115ByCidAndParentCid,
  getFile115ByPc,
  getFile115RandomByCidList,
  getFile115RandomByCidListExcludePc,
} from '../file-db.service';
import {
  getLocalRandomPicCacheFileList,
  getRandomCacheConfig,
  getRandomCacheLimitNotice,
  getRandomCacheStats,
  pickRandomSourceByWeights,
} from './picture-cache-random-core';
import { ensureRandomLocalPicCacheByFileAsync, getPicCacheFolders } from './picture-cache-fs-folder';
import {
  buildRandomMetaFromRandomLocalCacheItem,
  buildRandomPicMetaFromFile,
  mergeNotice,
} from './picture-cache-random-meta-queue';
import { getRequestActingUserId } from '../../../../utils/request-context';

const randomPickedHistoryByUser = new Map<string, Array<{ pc: string; pickedAt: number }>>();

const getRandomPickedHistory = () => {
  const key = getRequestActingUserId() || 'public';
  const existing = randomPickedHistoryByUser.get(key);
  if (existing) {
    return existing;
  }
  const created: Array<{ pc: string; pickedAt: number }> = [];
  randomPickedHistoryByUser.set(key, created);
  return created;
};

const pickRandomItem = <T>(list: T[]): T | undefined => {
  if (list.length === 0) {
    return undefined;
  }

  const index = generateRandomNumber(0, list.length - 1);
  return list[index] || list[0];
};

const pruneRandomPickedHistory = (
  randomPickedHistory: Array<{ pc: string; pickedAt: number }>,
  now: number,
  windowMs: number,
  maxCount: number
) => {
  if (windowMs <= 0 || maxCount <= 0) {
    randomPickedHistory.length = 0;
    return;
  }

  const minPickedAt = now - windowMs;
  while (randomPickedHistory.length > 0 && randomPickedHistory[0].pickedAt < minPickedAt) {
    randomPickedHistory.shift();
  }

  if (randomPickedHistory.length > maxCount) {
    randomPickedHistory.splice(0, randomPickedHistory.length - maxCount);
  }
};

const getRecentPickedPcSet = (
  randomPickedHistory: Array<{ pc: string; pickedAt: number }>,
  now: number,
  windowMs: number,
  maxCount: number
) => {
  if (windowMs <= 0 || maxCount <= 0) {
    randomPickedHistory.length = 0;
    return new Set<string>();
  }

  pruneRandomPickedHistory(randomPickedHistory, now, windowMs, maxCount);
  return new Set(randomPickedHistory.map(item => item.pc).filter(Boolean));
};

const rememberPickedPc = (
  randomPickedHistory: Array<{ pc: string; pickedAt: number }>,
  pc: string,
  now: number,
  windowMs: number,
  maxCount: number
) => {
  if (windowMs <= 0 || maxCount <= 0) {
    return;
  }

  const normalizedPc = String(pc || '').trim();
  if (!normalizedPc) {
    return;
  }

  randomPickedHistory.push({
    pc: normalizedPc,
    pickedAt: now,
  });
  pruneRandomPickedHistory(randomPickedHistory, now, windowMs, maxCount);
};

const getDedupeLogMeta = (
  randomPickedHistory: Array<{ pc: string; pickedAt: number }>,
  recentPickedPcSet: Set<string>,
  windowMs: number,
  maxCount: number
) => {
  return {
    enabled: windowMs > 0 && maxCount > 0,
    windowMs,
    maxCount,
    recentUniqueCount: recentPickedPcSet.size,
    recentRecordCount: randomPickedHistory.length,
  };
};

const logRandomMetaFinished = (payload: Record<string, unknown>) => {
  log.info('[115-random] 随机图片结果', payload);
};

export async function getRandom115PicMeta(userAgent: string): Promise<RandomPicMeta> {
  const randomPickedHistory = getRandomPickedHistory();
  const startAt = Date.now();
  const loadConfigStartAt = Date.now();
  const [folders, randomCacheConfig, randomCacheList] = await Promise.all([
    getPicCacheFolders(),
    getRandomCacheConfig(),
    getLocalRandomPicCacheFileList(),
  ]);
  const loadConfigMs = Date.now() - loadConfigStartAt;
  const dedupeWindowMs = Math.max(0, Number(randomCacheConfig.randomNoRepeatWindowMinutes || 0)) * 60 * 1000;
  const dedupeMaxCount = Math.max(0, Math.round(Number(randomCacheConfig.randomNoRepeatMaxCount || 0)));
  const recentPickedPcSet = getRecentPickedPcSet(randomPickedHistory, startAt, dedupeWindowMs, dedupeMaxCount);
  const dedupeLogMeta = getDedupeLogMeta(randomPickedHistory, recentPickedPcSet, dedupeWindowMs, dedupeMaxCount);
  const availableRootCids = folders
    .filter(item => item.status === 'cached' || item.status === 'caching')
    .map(item => item.cid);
  const randomCacheStats: PicRandomCacheStats = getRandomCacheStats(randomCacheConfig, randomCacheList);
  const limitNotice = getRandomCacheLimitNotice(randomCacheStats, randomCacheConfig);

  if (availableRootCids.length === 0) {
    log.warn('[115-random] 随机图片失败', {
      reason: 'no-cache-folder',
      loadConfigMs,
      totalMs: Date.now() - startAt,
      dedupe: dedupeLogMeta,
    });
    badRequest('暂无缓存图片，请先缓存');
  }

  const selectedSource = pickRandomSourceByWeights(randomCacheConfig.sourceWeights);
  const sourceUnavailableNotice: string[] = [];

  if (selectedSource === 'local') {
    const localFlowStartAt = Date.now();
    let getDbFileMs = 0;
    let buildMetaMs: number | undefined;

    if (randomCacheList.length > 0) {
      const localUnseenList = randomCacheList.filter(item => !recentPickedPcSet.has(item.pc));
      if (localUnseenList.length === 0) {
        sourceUnavailableNotice.push('本地缓存在去重窗口内均已出现，已兜底到115云');
      } else {
        const localTryList = [...localUnseenList];
        let localItem: (typeof localUnseenList)[number] | undefined;
        let safeDbFile: Cloud115DbFileItem | undefined;

        while (localTryList.length > 0) {
          const index = generateRandomNumber(0, localTryList.length - 1);
          const candidate = localTryList.splice(index, 1)[0];
          if (!candidate) {
            continue;
          }
          const getDbFileStartAt = Date.now();
          const dbFile = await getFile115ByPc(candidate.pc);
          getDbFileMs += Date.now() - getDbFileStartAt;
          const normalizedDbFile = dbFile as Cloud115DbFileItem | undefined;
          if (!normalizedDbFile?.cid || !availableRootCids.includes(normalizedDbFile.cid)) {
            continue;
          }
          localItem = candidate;
          safeDbFile = normalizedDbFile;
          break;
        }

        if (!localItem || !safeDbFile) {
          sourceUnavailableNotice.push('本地缓存未命中当前缓存目录，已兜底到115云');
        } else {
          const buildMetaStartAt = Date.now();
          const meta = await buildRandomMetaFromRandomLocalCacheItem(localItem, mergeNotice(limitNotice));
          buildMetaMs = Date.now() - buildMetaStartAt;
          const totalMs = Date.now() - startAt;
          const localFlowMs = Date.now() - localFlowStartAt;
          rememberPickedPc(randomPickedHistory, meta.pc, Date.now(), dedupeWindowMs, dedupeMaxCount);
          logRandomMetaFinished({
            selectedSource,
            finalSource: 'local-file-cache',
            fallback: false,
            dedupeBypass: false,
            targetPc: meta.pc,
            targetCid: meta.cid,
            randomCacheMemoryCount: randomCacheStats.memoryFileCount,
            randomCacheLocalCount: randomCacheStats.localFileCount,
            timingsMs: {
              loadConfigMs,
              localFlowMs,
              getDbFileMs,
              buildMetaMs,
              totalMs,
            },
            dedupe: dedupeLogMeta,
          });
          return meta;
        }
      }
    } else {
      sourceUnavailableNotice.push('本地文件缓存为空，已兜底到115云');
    }
  }

  const pickFileStartAt = Date.now();
  const dedupeExcludedPcList = Array.from(recentPickedPcSet);
  let selectedFile = await getFile115RandomByCidListExcludePc(availableRootCids, dedupeExcludedPcList);
  let dedupeBypass = false;
  if (!selectedFile) {
    selectedFile = await getFile115RandomByCidList(availableRootCids);
    dedupeBypass = Boolean(selectedFile?.pc && recentPickedPcSet.has(selectedFile.pc));
  }
  const safeSelectedFile = selectedFile || badRequest('暂无可用缓存图片，请稍后重试');
  const pickFileMs = Date.now() - pickFileStartAt;
  const buildMetaStartAt = Date.now();
  const meta = await buildRandomPicMetaFromFile(safeSelectedFile, userAgent);
  const buildMetaMs = Date.now() - buildMetaStartAt;
  const mergedNotice = mergeNotice(meta.notice, limitNotice);

  void ensureRandomLocalPicCacheByFileAsync(safeSelectedFile, userAgent);
  rememberPickedPc(randomPickedHistory, meta.pc, Date.now(), dedupeWindowMs, dedupeMaxCount);
  const totalMs = Date.now() - startAt;
  const finalSource = selectedSource === 'cloud' ? 'cloud-115' : `${selectedSource}-fallback-cloud-115`;
  logRandomMetaFinished({
    selectedSource,
    finalSource,
    fallback: selectedSource !== 'cloud',
    dedupeBypass,
    targetPc: safeSelectedFile.pc,
    targetCid: safeSelectedFile.cid,
    targetParentCid: safeSelectedFile.parentCid,
    sourceUnavailableNotice: sourceUnavailableNotice.length > 0 ? sourceUnavailableNotice : undefined,
    randomCacheMemoryCount: randomCacheStats.memoryFileCount,
    randomCacheMemorySizeMb: randomCacheStats.memoryTotalSizeMb,
    randomCacheLocalCount: randomCacheStats.localFileCount,
    randomCacheLocalSizeMb: randomCacheStats.localTotalSizeMb,
    timingsMs: {
      loadConfigMs,
      pickFileMs,
      buildMetaMs,
      totalMs,
    },
    dedupe: {
      ...dedupeLogMeta,
      excludedPcCount: dedupeExcludedPcList.length,
    },
  });

  return {
    ...meta,
    notice: mergedNotice || undefined,
  };
}

export async function getRandom115PicFromParentMeta(params: { pc: string; userAgent: string }): Promise<RandomPicMeta> {
  const randomPickedHistory = getRandomPickedHistory();
  const startAt = Date.now();
  const randomCacheConfig = await getRandomCacheConfig();
  const dedupeWindowMs = Math.max(0, Number(randomCacheConfig.randomNoRepeatWindowMinutes || 0)) * 60 * 1000;
  const dedupeMaxCount = Math.max(0, Math.round(Number(randomCacheConfig.randomNoRepeatMaxCount || 0)));
  const recentPickedPcSet = getRecentPickedPcSet(randomPickedHistory, startAt, dedupeWindowMs, dedupeMaxCount);
  const dedupeLogMeta = getDedupeLogMeta(randomPickedHistory, recentPickedPcSet, dedupeWindowMs, dedupeMaxCount);
  const pc = params.pc.trim();
  if (!pc) {
    badRequest('缺少图片参数');
  }

  const findCurrentStartAt = Date.now();
  const currentFile = await getFile115ByPc(pc);
  const findCurrentFileMs = Date.now() - findCurrentStartAt;
  if (!currentFile) {
    badRequest('未找到当前图片');
  }
  const safeCurrentFile = currentFile as Cloud115DbFileItem;

  const querySiblingStartAt = Date.now();
  const sameFolderFiles = await getFile115ByCidAndParentCid(
    safeCurrentFile.cid,
    safeCurrentFile.parentCid || safeCurrentFile.cid
  );
  const querySiblingMs = Date.now() - querySiblingStartAt;
  const siblingFiles = sameFolderFiles.filter(item => item.pc !== safeCurrentFile.pc);

  if (siblingFiles.length === 0) {
    const buildMetaStartAt = Date.now();
    const meta = await buildRandomPicMetaFromFile(safeCurrentFile, params.userAgent, '当前目录没有其他图片可切换');
    const buildMetaMs = Date.now() - buildMetaStartAt;
    rememberPickedPc(randomPickedHistory, meta.pc, Date.now(), dedupeWindowMs, dedupeMaxCount);
    log.info('[115-random] 同目录随机图片结果', {
      finalSource: 'parent-current-file',
      dedupeBypass: true,
      targetPc: meta.pc,
      targetCid: meta.cid,
      siblingCount: siblingFiles.length,
      timingsMs: {
        findCurrentFileMs,
        querySiblingMs,
        buildMetaMs,
        totalMs: Date.now() - startAt,
      },
      dedupe: dedupeLogMeta,
    });
    return meta;
  }

  const siblingUnseenList = siblingFiles.filter(item => !recentPickedPcSet.has(item.pc));
  const nextFile =
    pickRandomItem(siblingUnseenList) || pickRandomItem(siblingFiles) || badRequest('当前目录没有可用图片');
  const dedupeBypass = siblingUnseenList.length === 0;
  const buildMetaStartAt = Date.now();
  const meta = await buildRandomPicMetaFromFile(nextFile, params.userAgent);
  const buildMetaMs = Date.now() - buildMetaStartAt;
  rememberPickedPc(randomPickedHistory, meta.pc, Date.now(), dedupeWindowMs, dedupeMaxCount);
  log.info('[115-random] 同目录随机图片结果', {
    finalSource: 'parent-sibling-file',
    dedupeBypass,
    targetPc: meta.pc,
    targetCid: meta.cid,
    siblingCount: siblingFiles.length,
    timingsMs: {
      findCurrentFileMs,
      querySiblingMs,
      buildMetaMs,
      totalMs: Date.now() - startAt,
    },
    dedupe: dedupeLogMeta,
  });
  return meta;
}
