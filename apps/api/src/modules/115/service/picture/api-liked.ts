import type { Like115PicParams } from '@volix/types';
import path from 'path';
import mime from 'mime-types';
import { badRequest } from '../../../shared/http-handler';
import type { Cloud115DbFileItem } from '../../types/115.types';
import { get115FileData } from '../file.service';
import { getFile115ByPc, getFile115PathByPc, setFile115LikedByPc } from '../file-db.service';
import {
  DEFAULT_115_DOWNLOAD_UA,
  DEFAULT_FILE_NAME,
  DEFAULT_MIME_TYPE,
  getLocalRandomPicCacheByFileName,
  sanitizeCacheFileName,
} from './picture-cache-random-core';
import {
  clearLocalPicCacheByPc,
  clearLocalPicCacheByPcFromFs,
  ensureLocalPicCacheByFileAsync,
  getLocalPicCacheByFile,
  getLocalPicCacheByPc,
  getLocalPicCacheByPcFromFs,
  getLocalPicCacheFileList,
  parse115FileMeta,
} from './picture-cache-fs-folder';

export async function like115PicData(params: Like115PicParams, userAgent: string) {
  const pc = params.pc?.trim() || '';
  if (!pc) {
    badRequest('缺少图片参数');
  }

  const file = await getFile115ByPc(pc);
  if (!file) {
    if (params.liked === false) {
      const removed = await clearLocalPicCacheByPcFromFs(pc);
      if (!removed) {
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
  } else {
    void clearLocalPicCacheByPc(pc);
    void clearLocalPicCacheByPcFromFs(pc);
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

export async function getLiked115PicListData(params?: { offset?: number; pageSize?: number }, _userAgent = '') {
  const offset = Math.max(0, Number(params?.offset || 0));
  const pageSize = Math.min(200, Math.max(1, Number(params?.pageSize || 50)));
  const localCacheList = (await getLocalPicCacheFileList()).sort((a, b) => b.updatedAtMs - a.updatedAtMs);
  const count = localCacheList.length;
  const pageData = localCacheList.slice(offset, offset + pageSize);
  const data = pageData.map(item => ({
    pc: item.pc,
    cid: '',
    path: '',
    parentPath: '',
    fileName: item.fileName,
    liked: true,
    cached: true,
    url: item.url,
  }));

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

export async function get115RandomPicCacheFileData(cacheFileName: string) {
  const safeName = sanitizeCacheFileName(String(cacheFileName || '').trim());
  if (!safeName) {
    badRequest('缺少缓存文件参数');
  }

  const cache = await getLocalRandomPicCacheByFileName(safeName);
  if (!cache) {
    badRequest('未找到本地随机缓存文件');
  }
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

export async function get115PicCacheFileByPcData(pc: string, userAgent = '') {
  const normalizedPc = String(pc || '').trim();
  if (!normalizedPc) {
    badRequest('缺少图片参数');
  }

  const localFsCache = await getLocalPicCacheByPcFromFs(normalizedPc);
  if (localFsCache) {
    return {
      kind: 'local' as const,
      pc: localFsCache.pc,
      filePath: localFsCache.filePath,
      fileName: localFsCache.fileName,
      mimeType: localFsCache.mimeType,
      url: localFsCache.url,
    };
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
