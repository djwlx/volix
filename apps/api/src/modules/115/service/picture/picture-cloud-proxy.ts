import { getRandomCacheConfig } from './picture-cache-random-core';

export const buildCloudProxyUrl = (originUrl: string, proxyUrl: string, userAgent?: string) => {
  const safeOriginUrl = String(originUrl || '').trim();
  const safeProxyUrl = String(proxyUrl || '').trim();
  if (!safeOriginUrl || !safeProxyUrl) {
    return safeOriginUrl;
  }

  const target = new URL(safeProxyUrl);
  target.searchParams.set('url', safeOriginUrl);
  const safeUserAgent = String(userAgent || '').trim();
  if (safeUserAgent) {
    target.searchParams.set('ua', safeUserAgent);
  }
  return target.toString();
};

export const resolve115CloudImageUrl = async (originUrl: string, userAgent?: string) => {
  const config = await getRandomCacheConfig();
  return buildCloudProxyUrl(originUrl, config.cloudProxyUrl, userAgent);
};
