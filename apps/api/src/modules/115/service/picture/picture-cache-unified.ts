import fs from 'fs';
import path from 'path';
import { getFile115CachePolicyByPcList, setFile115LocalCacheFileNameByPc } from '../file-db.service';
import {
  clearLocalRandomPicCacheByPc,
  getRandomPicCacheDir,
  parsePcFromLocalCacheFileName,
} from './picture-cache-random-core';
import { clearWebpCacheByPc } from './picture-cache-format';

const RANDOM_META_FILE_NAME = 'meta.random-picture.json';
const WEBP_CACHE_DIR_NAME = 'webp';

type RootCacheFile = {
  type: 'origin';
  pc: string;
  fileName: string;
  filePath: string;
  sizeBytes: number;
  updatedAtMs: number;
};

type FormattedCacheFile = {
  type: 'formatted';
  pc: string;
  fileName: string;
  filePath: string;
  sizeBytes: number;
  updatedAtMs: number;
};

type UnifiedCacheFile = RootCacheFile | FormattedCacheFile;

export type UnifiedPicCacheUsage = {
  rootFileCount: number;
  rootTotalSizeBytes: number;
  formattedFileCount: number;
  formattedTotalSizeBytes: number;
  totalFileCount: number;
  totalSizeBytes: number;
};

const resolveCacheDir = (cacheDir?: string) => cacheDir || getRandomPicCacheDir();
const getWebpCacheDir = (cacheDir?: string) => path.join(resolveCacheDir(cacheDir), WEBP_CACHE_DIR_NAME);

const getFileStat = async (filePath: string) => {
  try {
    return await fs.promises.stat(filePath);
  } catch {
    return undefined;
  }
};

const shouldIgnoreTopLevelFile = (fileName: string) => {
  if (!fileName) {
    return true;
  }
  if (fileName === RANDOM_META_FILE_NAME) {
    return true;
  }
  if (fileName.endsWith('.tmp')) {
    return true;
  }
  return false;
};

const getFormattedPc = (fileName: string) => {
  const raw = String(fileName || '').trim();
  const splitIndex = raw.indexOf('.');
  if (splitIndex <= 0) {
    return '';
  }
  return raw.slice(0, splitIndex).trim();
};

export const getUnifiedRootCacheFileList = async (cacheDir?: string) => {
  try {
    const entries = await fs.promises.readdir(resolveCacheDir(cacheDir), {
      withFileTypes: true,
    });
    const files = await Promise.all(
      entries
        .filter(item => item.isFile())
        .map(async item => {
          const fileName = String(item.name || '').trim();
          if (shouldIgnoreTopLevelFile(fileName)) {
            return undefined;
          }
          const pc = parsePcFromLocalCacheFileName(fileName);
          if (!pc) {
            return undefined;
          }
          const filePath = path.join(resolveCacheDir(cacheDir), fileName);
          const stat = await getFileStat(filePath);
          if (!stat?.isFile()) {
            return undefined;
          }
          return {
            type: 'origin',
            pc,
            fileName,
            filePath,
            sizeBytes: Number(stat.size || 0),
            updatedAtMs: Number(stat.mtimeMs || stat.ctimeMs || 0),
          } satisfies RootCacheFile;
        })
    );

    return files.filter(item => Boolean(item)) as RootCacheFile[];
  } catch {
    return [] as RootCacheFile[];
  }
};

export const getUnifiedFormattedCacheFileList = async (cacheDir?: string) => {
  try {
    const entries = await fs.promises.readdir(getWebpCacheDir(cacheDir), {
      withFileTypes: true,
    });
    const files = await Promise.all(
      entries
        .filter(item => item.isFile())
        .map(async item => {
          const fileName = String(item.name || '').trim();
          if (!fileName || fileName.endsWith('.tmp.webp') || !fileName.endsWith('.webp')) {
            return undefined;
          }
          const pc = getFormattedPc(fileName);
          if (!pc) {
            return undefined;
          }
          const filePath = path.join(getWebpCacheDir(cacheDir), fileName);
          const stat = await getFileStat(filePath);
          if (!stat?.isFile()) {
            return undefined;
          }
          return {
            type: 'formatted',
            pc,
            fileName,
            filePath,
            sizeBytes: Number(stat.size || 0),
            updatedAtMs: Number(stat.mtimeMs || stat.ctimeMs || 0),
          } satisfies FormattedCacheFile;
        })
    );

    return files.filter(item => Boolean(item)) as FormattedCacheFile[];
  } catch {
    return [] as FormattedCacheFile[];
  }
};

export const getUnifiedPicCacheUsage = async (cacheDir?: string): Promise<UnifiedPicCacheUsage> => {
  const [rootFiles, formattedFiles] = await Promise.all([
    getUnifiedRootCacheFileList(cacheDir),
    getUnifiedFormattedCacheFileList(cacheDir),
  ]);
  const rootTotalSizeBytes = rootFiles.reduce((sum, item) => sum + item.sizeBytes, 0);
  const formattedTotalSizeBytes = formattedFiles.reduce((sum, item) => sum + item.sizeBytes, 0);
  return {
    rootFileCount: rootFiles.length,
    rootTotalSizeBytes,
    formattedFileCount: formattedFiles.length,
    formattedTotalSizeBytes,
    totalFileCount: rootFiles.length + formattedFiles.length,
    totalSizeBytes: rootTotalSizeBytes + formattedTotalSizeBytes,
  };
};

export const cleanupOrphanUnifiedCacheFiles = async (validLocalCacheFileNameSet: Set<string>, cacheDir?: string) => {
  const normalizedValidSet = new Set(
    Array.from(validLocalCacheFileNameSet)
      .map(item => String(item || '').trim())
      .filter(Boolean)
  );
  const cacheRootDir = resolveCacheDir(cacheDir);
  let removedTopLevelCount = 0;
  let removedFormattedCount = 0;

  try {
    const entries = await fs.promises.readdir(cacheRootDir, { withFileTypes: true });
    await Promise.all(
      entries
        .filter(item => item.isFile())
        .map(async item => {
          const fileName = String(item.name || '').trim();
          if (shouldIgnoreTopLevelFile(fileName)) {
            return;
          }
          if (normalizedValidSet.has(fileName)) {
            return;
          }
          await fs.promises.unlink(path.join(cacheRootDir, fileName)).catch(() => undefined);
          removedTopLevelCount += 1;
        })
    );
  } catch {
    // ignore
  }

  const validPcSet = new Set(
    Array.from(normalizedValidSet)
      .map(item => parsePcFromLocalCacheFileName(item))
      .filter(Boolean)
  );

  try {
    const entries = await fs.promises.readdir(getWebpCacheDir(cacheDir), { withFileTypes: true });
    await Promise.all(
      entries
        .filter(item => item.isFile())
        .map(async item => {
          const fileName = String(item.name || '').trim();
          if (!fileName || fileName.endsWith('.tmp.webp') || !fileName.endsWith('.webp')) {
            return;
          }
          const pc = getFormattedPc(fileName);
          if (!pc || validPcSet.has(pc)) {
            return;
          }
          await fs.promises.unlink(path.join(getWebpCacheDir(cacheDir), fileName)).catch(() => undefined);
          removedFormattedCount += 1;
        })
    );
  } catch {
    // ignore
  }

  return {
    removedTopLevelCount,
    removedFormattedCount,
    removedCount: removedTopLevelCount + removedFormattedCount,
  };
};

export const evictUnifiedPicCacheToFit = async (params: {
  maxSizeBytes: number;
  reserveSizeBytes?: number;
  keepPc?: string;
}) => {
  const maxSizeBytes = Math.max(0, Number(params.maxSizeBytes || 0));
  const reserveSizeBytes = Math.max(0, Number(params.reserveSizeBytes || 0));
  const keepPc = String(params.keepPc || '').trim();

  if (maxSizeBytes <= 0) {
    return getUnifiedPicCacheUsage();
  }

  const [originFiles, formattedFiles, beforeUsage] = await Promise.all([
    getUnifiedRootCacheFileList(),
    getUnifiedFormattedCacheFileList(),
    getUnifiedPicCacheUsage(),
  ]);

  let currentTotalSizeBytes = beforeUsage.totalSizeBytes;
  if (currentTotalSizeBytes + reserveSizeBytes <= maxSizeBytes) {
    return beforeUsage;
  }

  const pcList = Array.from(new Set([...originFiles.map(item => item.pc), ...formattedFiles.map(item => item.pc)]));
  const policyRows = await getFile115CachePolicyByPcList(pcList);
  const policyMap = new Map(policyRows.map(item => [item.pc, item]));
  const candidates: UnifiedCacheFile[] = [...formattedFiles, ...originFiles];
  candidates.sort((left, right) => {
    const leftTypeRank = left.type === 'formatted' ? 0 : 1;
    const rightTypeRank = right.type === 'formatted' ? 0 : 1;
    if (leftTypeRank !== rightTypeRank) {
      return leftTypeRank - rightTypeRank;
    }
    const leftLiked = policyMap.get(left.pc)?.isLiked ? 1 : 0;
    const rightLiked = policyMap.get(right.pc)?.isLiked ? 1 : 0;
    if (leftLiked !== rightLiked) {
      return leftLiked - rightLiked;
    }
    if (left.updatedAtMs !== right.updatedAtMs) {
      return left.updatedAtMs - right.updatedAtMs;
    }
    return right.sizeBytes - left.sizeBytes;
  });

  const clearedPcSet = new Set<string>();
  for (const item of candidates) {
    if (currentTotalSizeBytes + reserveSizeBytes <= maxSizeBytes) {
      break;
    }
    if (!item.pc || item.pc === keepPc) {
      continue;
    }

    if (item.type === 'formatted') {
      if (clearedPcSet.has(item.pc)) {
        continue;
      }
      await fs.promises.unlink(item.filePath).catch(() => undefined);
      currentTotalSizeBytes = Math.max(0, currentTotalSizeBytes - item.sizeBytes);
      continue;
    }

    if (clearedPcSet.has(item.pc)) {
      continue;
    }
    await clearLocalRandomPicCacheByPc(item.pc);
    await setFile115LocalCacheFileNameByPc(item.pc, null);
    await clearWebpCacheByPc(item.pc);
    clearedPcSet.add(item.pc);
    const usage = await getUnifiedPicCacheUsage();
    currentTotalSizeBytes = usage.totalSizeBytes;
  }

  return getUnifiedPicCacheUsage();
};
