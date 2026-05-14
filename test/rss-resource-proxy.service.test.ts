import { describe, expect, it, vi, beforeEach } from 'vitest';

const { cacheRemoteResourceMock, getCachedResourceBySourceUrlMock, buildResourceProxyUrlMock } = vi.hoisted(() => {
  return {
    cacheRemoteResourceMock: vi.fn(),
    getCachedResourceBySourceUrlMock: vi.fn(),
    buildResourceProxyUrlMock: vi.fn(),
  };
});

vi.mock('../apps/api/src/modules/shared/service/resource-proxy-cache.service', () => {
  return {
    cacheRemoteResource: cacheRemoteResourceMock,
    getCachedResourceBySourceUrl: getCachedResourceBySourceUrlMock,
    buildResourceProxyUrl: buildResourceProxyUrlMock,
  };
});

import { rewriteRssXmlResourceUrls } from '../apps/api/src/modules/rss/service/rss-resource-proxy.service';

describe('rewriteRssXmlResourceUrls', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns quickly, only rewrites cached resources, and keeps missing resources unchanged', async () => {
    const cachedUrl = 'https://img.example.com/a.jpg';
    const missingUrl = 'https://img.example.com/b.jpg';
    const xml = `<item><img src="${cachedUrl}" /><img src="${missingUrl}" /></item>`;

    getCachedResourceBySourceUrlMock.mockImplementation(async ({ sourceUrl }: { sourceUrl: string }) => {
      if (sourceUrl === cachedUrl) {
        return {
          cacheKey: 'a'.repeat(64),
          sourceUrl,
          fileName: 'a.jpg',
          contentType: 'image/jpeg',
          sizeBytes: 123,
          updatedAtMs: Date.now(),
          filePath: '/tmp/a.jpg',
        };
      }
      return null;
    });

    buildResourceProxyUrlMock.mockImplementation(
      ({ cacheKey }: { cacheKey: string }) => `/api/rss/resource-cache/${cacheKey}`
    );
    cacheRemoteResourceMock.mockReturnValue(new Promise(() => undefined));

    const timeout = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('rewrite timed out')), 300);
    });

    const rewrittenXml = await Promise.race([
      rewriteRssXmlResourceUrls({
        xml,
        requestProxyUrl: '',
        cacheSizeMb: 128,
      }),
      timeout,
    ]);

    expect(rewrittenXml).toContain(
      '/api/rss/resource-cache/aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'
    );
    expect(rewrittenXml).toContain(missingUrl);
    expect(cacheRemoteResourceMock).toHaveBeenCalledTimes(1);
    expect(cacheRemoteResourceMock).toHaveBeenCalledWith(
      expect.objectContaining({
        scope: 'rss',
        sourceUrl: missingUrl,
      })
    );
  });

  it('does not start duplicate background cache jobs for the same uncached url in-flight', async () => {
    const url = 'https://img.example.com/dup.jpg';
    const xml = `<item><img src="${url}" /></item>`;

    getCachedResourceBySourceUrlMock.mockResolvedValue(null);
    cacheRemoteResourceMock.mockReturnValue(new Promise(() => undefined));

    await rewriteRssXmlResourceUrls({ xml, requestProxyUrl: '', cacheSizeMb: 128 });
    await rewriteRssXmlResourceUrls({ xml, requestProxyUrl: '', cacheSizeMb: 128 });

    expect(cacheRemoteResourceMock).toHaveBeenCalledTimes(1);
  });
});
