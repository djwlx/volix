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
  getLocalRandomPicCacheByPc,
  getLocalRandomPicCacheByFileName,
  getPicCachePublicUrl,
  parsePcFromLocalCacheFileName,
  sanitizeCacheFileName,
} from './picture-cache-random-core';
import {
  clearLocalPicCacheByPcFromFs,
  ensureRandomLocalPicCacheByFile,
  ensureLocalPicCacheByFileAsync,
  getLocalPicCacheByFile,
  getLocalPicCacheByPc,
  getLocalPicCacheByPcFromFs,
  parse115FileMeta,
} from './picture-cache-fs-folder';
import {
  clearWebpCacheByPc,
  normalizePicCacheFormat,
  normalizePicCacheFormatOptions,
  resolvePicCacheByFormat,
} from './picture-cache-format';

export async function like115PicData(params: Like115PicParams, userAgent: string) {
  const pc = params.pc?.trim() || '';
  if (!pc) {
    badRequest('缺少图片参数');
  }

  const file = await getFile115ByPc(pc);
  if (!file) {
    if (params.liked === false) {
      const removed = await clearLocalPicCacheByPcFromFs(pc);
      const removedWebp = await clearWebpCacheByPc(pc);
      if (!removed && !removedWebp) {
        badRequest('未找到当前图片');
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

export async function get115RandomPicCacheFileData(cacheFileName: string, userAgent = '') {
  const safeName = sanitizeCacheFileName(String(cacheFileName || '').trim());
  if (!safeName) {
    badRequest('缺少缓存文件参数');
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
    badRequest('未找到本地随机缓存文件');
  }

  const file = await getFile115ByPc(pc);
  if (!file) {
    badRequest('未找到本地随机缓存文件');
  }
  const safeFile = file as Cloud115DbFileItem;

  try {
    await ensureRandomLocalPicCacheByFile(safeFile, userAgent || DEFAULT_115_DOWNLOAD_UA, { force: true });
  } catch {
    // ignore
  }

  const rebuiltCache = await getLocalRandomPicCacheByPc(pc);
  if (rebuiltCache) {
    return {
      kind: 'local' as const,
      pc: rebuiltCache.pc,
      filePath: rebuiltCache.filePath,
      fileName: rebuiltCache.fileName,
      mimeType: rebuiltCache.mimeType,
      url: rebuiltCache.url,
    };
  }

  const meta = parse115FileMeta(await get115FileData(safeFile.pc, userAgent || DEFAULT_115_DOWNLOAD_UA));
  if (!meta.url) {
    badRequest('未找到本地随机缓存文件');
  }

  return {
    kind: 'remote' as const,
    pc: safeFile.pc,
    url: meta.url,
    fileName: meta.fileName || (safeFile.fullPath ? path.posix.basename(safeFile.fullPath) : DEFAULT_FILE_NAME),
    mimeType: mime.lookup(meta.fileName || '') || DEFAULT_MIME_TYPE,
  };
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
    badRequest('缺少图片参数');
  }
  const cacheFormat = normalizePicCacheFormat(format);
  const formatOptions = normalizePicCacheFormatOptions({
    width: options?.width,
    quality: options?.quality,
  });

  const localFsCache = await getLocalPicCacheByPcFromFs(normalizedPc);
  if (localFsCache) {
    const formattedCache = await resolvePicCacheByFormat({
      format: cacheFormat,
      options: formatOptions,
      source: {
        pc: localFsCache.pc,
        filePath: localFsCache.filePath,
        fileName: localFsCache.fileName,
        mimeType: localFsCache.mimeType,
      },
    });
    return {
      kind: 'local' as const,
      pc: localFsCache.pc,
      filePath: formattedCache.filePath,
      fileName: formattedCache.fileName,
      mimeType: formattedCache.mimeType,
      url: localFsCache.url,
    };
  }

  const file = await getFile115ByPc(normalizedPc);
  if (!file) {
    badRequest('未找到当前图片');
  }
  const safeFile = file as Cloud115DbFileItem;
  const normalizedUserAgent = userAgent || DEFAULT_115_DOWNLOAD_UA;

  const prewarmWebpCacheByFileAsync = (targetFile: Cloud115DbFileItem) => {
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

  const cache = await getLocalPicCacheByFile({
    pc: safeFile.pc,
    localCacheFileName: safeFile.localCacheFileName,
  });
  if (cache) {
    const formattedCache = await resolvePicCacheByFormat({
      format: cacheFormat,
      options: formatOptions,
      source: {
        pc: cache.pc,
        filePath: cache.filePath,
        fileName: cache.fileName,
        mimeType: cache.mimeType,
      },
    });
    return {
      kind: 'local' as const,
      ...cache,
      filePath: formattedCache.filePath,
      fileName: formattedCache.fileName,
      mimeType: formattedCache.mimeType,
    };
  }

  if (cacheFormat === 'webp') {
    prewarmWebpCacheByFileAsync(safeFile);
    const meta = parse115FileMeta(await get115FileData(safeFile.pc, normalizedUserAgent));
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

  if (safeFile.isLiked) {
    void ensureLocalPicCacheByFileAsync(safeFile, normalizedUserAgent);
  }

  const meta = parse115FileMeta(await get115FileData(safeFile.pc, normalizedUserAgent));
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
