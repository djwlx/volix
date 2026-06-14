import path from 'path';
import { PATH } from '../../../utils/path';
import { getPublicRssResourceProxyDirList } from '../../rss/service/rss-public-resource-path.service';
import { getRssResourceProxyCacheDirByUserId } from '../../rss/service/rss-storage-path.service';
import type { ResourceProxyCacheRecord, ResourceProxyScope } from './resource-proxy-cache.service';

export type ResourceProxyUserScopedParams = {
  userId?: string;
};

export const sanitizeDataFileName = (value: string) => {
  const normalized = path.basename(String(value || '').trim()).replace(/[\\/:*?"<>|]/g, '_');
  if (!normalized || normalized.includes('..')) {
    return '';
  }
  return normalized;
};

export const buildDataFileName = (cacheKey: string, fileName: string) => {
  const safeFileName = sanitizeDataFileName(fileName);
  return safeFileName ? `${cacheKey}-${safeFileName}` : `${cacheKey}.bin`;
};

export const getScopeDir = (scope: ResourceProxyScope, params?: ResourceProxyUserScopedParams) => {
  if (scope === 'rss' && params?.userId) {
    return getRssResourceProxyCacheDirByUserId(params.userId);
  }
  return path.join(PATH.cache, 'rss-resource-proxy');
};

export const getScopeDirList = async (scope: ResourceProxyScope, params?: ResourceProxyUserScopedParams) => {
  if (scope === 'rss' && !params?.userId) {
    return [...(await getPublicRssResourceProxyDirList()), path.join(PATH.cache, 'rss-resource-proxy')];
  }
  return [getScopeDir(scope, params)];
};

export const getMetaPath = (scope: ResourceProxyScope, cacheKey: string, params?: ResourceProxyUserScopedParams) => {
  return path.join(getScopeDir(scope, params), `${cacheKey}.json`);
};

export const getDataPathByFileName = (
  scope: ResourceProxyScope,
  dataFileName: string,
  params?: ResourceProxyUserScopedParams
) => {
  return path.join(getScopeDir(scope, params), dataFileName);
};

export const getDataPathCandidates = (
  scope: ResourceProxyScope,
  cacheKey: string,
  record?: ResourceProxyCacheRecord,
  params?: ResourceProxyUserScopedParams
) => {
  return getDataPathCandidatesByDir(getScopeDir(scope, params), cacheKey, record);
};

export const getDataPathCandidatesByDir = (dir: string, cacheKey: string, record?: ResourceProxyCacheRecord) => {
  const fileNameCandidates = new Set<string>();
  const dataFileName = sanitizeDataFileName(record?.dataFileName || '');
  if (dataFileName) {
    fileNameCandidates.add(dataFileName);
  }
  const fallbackByFileName = buildDataFileName(cacheKey, String(record?.fileName || ''));
  if (fallbackByFileName) {
    fileNameCandidates.add(fallbackByFileName);
  }
  return Array.from(
    new Set([...Array.from(fileNameCandidates).map(name => path.join(dir, name)), path.join(dir, `${cacheKey}.bin`)])
  );
};
