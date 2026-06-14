import type { Like115PicParams } from '@volix/types';
import path from 'path';
import mime from 'mime-types';
import { badRequest } from '../../../shared/http-handler';
import type { Cloud115DbFileItem } from '../../types/115.types';
import { get115FileData } from '../file.service';
import {
  getFile115ByPc,
  getFile115PathByPc,
  getLikedFile115Count,
  getLikedFile115List,
  setFile115LikedByPc,
} from '../file-db.service';
import {
  DEFAULT_115_DOWNLOAD_UA,
  DEFAULT_FILE_NAME,
  DEFAULT_MIME_TYPE,
  getLocalRandomPicCacheByFileName,
  getPicCachePublicUrl,
  parsePcFromLocalCacheFileName,
  sanitizeCacheFileName,
} from './picture-cache-random-core';
import {
  clearLocalPicCacheByPcFromFs,
  ensureRandomLocalPicCacheByFileAsync,
  ensureLocalPicCacheByFileAsync,
  getLocalPicCacheByFile,
  getLocalPicCacheByPc,
  getLocalPicCacheByPcFromFs,
  parse115FileMeta,
} from './picture-cache-fs-folder';
import {
  clearWebpCacheByPc,
  getFreshWebpCacheIfExists,
  normalizePicCacheFormat,
  normalizePicCacheFormatOptions,
  type PicCacheFormatOptions,
  resolvePicCacheByFormat,
} from './picture-cache-format';
import { resolve115CloudImageUrl } from './picture-cloud-proxy';
import { t } from '../../../../utils/i18n';

const buildRemotePicSourceFromFile = async (file: Cloud115DbFileItem, userAgent: string, errorMessageKey: string) => {
  const meta = parse115FileMeta(await get115FileData(file.pc, userAgent || DEFAULT_115_DOWNLOAD_UA));
  if (!meta.url) {
    badRequest(t(errorMessageKey));
  }

  return {
    kind: 'remote' as const,
    pc: file.pc,
    url: await resolve115CloudImageUrl(meta.url, userAgent || DEFAULT_115_DOWNLOAD_UA),
    fileName: meta.fileName || (file.fullPath ? path.posix.basename(file.fullPath) : DEFAULT_FILE_NAME),
    mimeType: mime.lookup(meta.fileName || '') || DEFAULT_MIME_TYPE,
  };
};

const prewarmWebpCacheByFileAsync = (
  targetFile: Cloud115DbFileItem,
  normalizedUserAgent: string,
  formatOptions: PicCacheFormatOptions
) => {
  void ensureLocalPicCacheByFileAsync(targetFile, normalizedUserAgent)
    .then(async () => {
      const latestCache = await getLocalPicCacheByPc(targetFile.pc);
      if (!latestCache) {
        return;
      }
      await resolvePicCacheByFormat({
        format: 'webp',
        options: formatOptions,
        source: {
          pc: latestCache.pc,
          filePath: latestCache.filePath,
          fileName: latestCache.fileName,
          mimeType: latestCache.mimeType,
        },
      });
    })
    .catch(() => undefined);
};

export async function like115PicData(params: Like115PicParams, userAgent: string) {
  const pc = params.pc?.trim() || '';
  if (!pc) {
    badRequest(t('pic115Api.picParamRequired'));
  }

  const file = await getFile115ByPc(pc);
  if (!file) {
    if (params.liked === false) {
      const removed = await clearLocalPicCacheByPcFromFs(pc);
      const removedWebp = await clearWebpCacheByPc(pc);
      if (!removed && !removedWebp) {
        badRequest(t('pic115Api.currentPicNotFound'));
      }
      return {
        pc,
        cid: '',
        liked: false,
        path: '',
        parentPath: '',
        url: '',
        cached: false,
      };
    }
    badRequest(t('pic115Api.currentPicNotFound'));
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
  const [count, likedList] = await Promise.all([getLikedFile115Count(), getLikedFile115List(offset, pageSize)]);
  const data = await Promise.all(
    likedList.map(async item => {
      const cache = await getLocalPicCacheByFile({
        pc: item.pc,
        localCacheFileName: item.localCacheFileName,
      });
      if (!cache) {
        void ensureLocalPicCacheByFileAsync(item, userAgent || DEFAULT_115_DOWNLOAD_UA);
      }
      return {
        pc: item.pc,
        cid: item.cid,
        path: item.fullPath || '',
        parentPath: item.fullPath ? path.posix.dirname(item.fullPath) : '',
        fileName: cache?.fileName || (item.fullPath ? path.posix.basename(item.fullPath) : DEFAULT_FILE_NAME),
        liked: true,
        cached: Boolean(cache),
        url: cache?.url || getPicCachePublicUrl(item.pc),
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
    badRequest(t('pic115Api.picParamRequired'));
  }

  const info = await getFile115PathByPc(normalizedPc);
  if (!info) {
    badRequest(t('pic115Api.cachePathNotFound'));
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

export async function get115RandomPicCacheFileData(cacheFileName: string, userAgent = '') {
  const safeName = sanitizeCacheFileName(String(cacheFileName || '').trim());
  if (!safeName) {
    badRequest(t('pic115Api.cacheFileParamRequired'));
  }

  const cache = await getLocalRandomPicCacheByFileName(safeName);
  if (cache) {
    const safeCache = cache as NonNullable<typeof cache>;

    return {
      kind: 'local' as const,
      pc: safeCache.pc,
      filePath: safeCache.filePath,
      fileName: safeCache.fileName,
      mimeType: safeCache.mimeType,
      url: safeCache.url,
    };
  }

  const pc = parsePcFromLocalCacheFileName(safeName);
  if (!pc) {
    badRequest(t('pic115Api.localRandomCacheNotFound'));
  }

  const file = await getFile115ByPc(pc);
  if (!file) {
    badRequest(t('pic115Api.localRandomCacheNotFound'));
  }
  const safeFile = file as Cloud115DbFileItem;
  void ensureRandomLocalPicCacheByFileAsync(safeFile, userAgent || DEFAULT_115_DOWNLOAD_UA);
  return buildRemotePicSourceFromFile(
    safeFile,
    userAgent || DEFAULT_115_DOWNLOAD_UA,
    'pic115Api.localRandomCacheNotFound'
  );
}

export async function get115PicCacheFileByPcData(
  pc: string,
  userAgent = '',
  format?: string,
  options?: {
    width?: string;
    quality?: string;
  }
) {
  const normalizedPc = String(pc || '').trim();
  if (!normalizedPc) {
    badRequest(t('pic115Api.picParamRequired'));
  }
  const cacheFormat = normalizePicCacheFormat(format);
  const formatOptions = normalizePicCacheFormatOptions({
    width: options?.width,
    quality: options?.quality,
  });

  // 1) webp 命中快路径：直接 stat 确定性 webp 路径，命中即返回（零目录扫描、零 sharp）
  if (cacheFormat === 'webp') {
    const freshWebp = await getFreshWebpCacheIfExists(normalizedPc, formatOptions);
    if (freshWebp) {
      return {
        kind: 'local' as const,
        pc: normalizedPc,
        filePath: freshWebp.filePath,
        fileName: freshWebp.fileName,
        mimeType: freshWebp.mimeType,
        url: getPicCachePublicUrl(normalizedPc),
      };
    }
  }

  // 2) 原图定位优先走 DB（O(1)），仅在 DB 未命中时回退到目录扫描兜底
  const file = await getFile115ByPc(normalizedPc);
  const normalizedUserAgent = userAgent || DEFAULT_115_DOWNLOAD_UA;
  const dbCache = file
    ? await getLocalPicCacheByFile({
        pc: file.pc,
        localCacheFileName: file.localCacheFileName,
      })
    : undefined;
  const localCache = dbCache || (await getLocalPicCacheByPcFromFs(normalizedPc));

  if (localCache) {
    const formattedCache = await resolvePicCacheByFormat({
      format: cacheFormat,
      options: formatOptions,
      source: {
        pc: localCache.pc,
        filePath: localCache.filePath,
        fileName: localCache.fileName,
        mimeType: localCache.mimeType,
      },
    });
    return {
      kind: 'local' as const,
      pc: localCache.pc,
      filePath: formattedCache.filePath,
      fileName: formattedCache.fileName,
      mimeType: formattedCache.mimeType,
      url: localCache.url,
    };
  }

  // 3) 完全未缓存：异步预热本地缓存，本次先回源
  if (!file) {
    badRequest(t('pic115Api.currentPicNotFound'));
  }
  const safeFile = file as Cloud115DbFileItem;

  if (cacheFormat === 'webp') {
    prewarmWebpCacheByFileAsync(safeFile, normalizedUserAgent, formatOptions);
  } else {
    void ensureLocalPicCacheByFileAsync(safeFile, normalizedUserAgent);
  }

  return buildRemotePicSourceFromFile(safeFile, normalizedUserAgent, 'pic115Api.picUrlResolveFailed');
}
