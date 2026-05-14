import { beforeEach, describe, expect, test, vi } from 'vitest';

const cacheRemoteResourceMock = vi.fn();
const buildResourceProxyUrlMock = vi.fn();
const getCachedResourceBySourceUrlMock = vi.fn();

vi.mock('../../apps/api/src/modules/shared/service/resource-proxy-cache.service', () => ({
  cacheRemoteResource: cacheRemoteResourceMock,
  buildResourceProxyUrl: buildResourceProxyUrlMock,
  getCachedResourceBySourceUrl: getCachedResourceBySourceUrlMock,
}));

describe('rss resource proxy xml rewrite', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  test('rewrites xml-escaped html resource urls to cached proxy urls', async () => {
    getCachedResourceBySourceUrlMock.mockImplementation(async ({ sourceUrl }: { sourceUrl: string }) => {
      if (sourceUrl.includes('/a.jpg')) {
        return { cacheKey: 'key-a' };
      }
      if (sourceUrl.includes('/b.jpg')) {
        return { cacheKey: 'key-b' };
      }
      if (sourceUrl.includes('/c.jpg')) {
        return { cacheKey: 'key-c' };
      }
      return { cacheKey: 'key-unknown' };
    });

    buildResourceProxyUrlMock.mockImplementation(({ cacheKey }: { cacheKey: string }) => {
      return `/api/rss/resource-cache/${cacheKey}`;
    });

    const { rewriteRssXmlResourceUrls } = await import(
      '../../apps/api/src/modules/rss/service/rss-resource-proxy.service'
    );

    const xml =
      '<?xml version="1.0" encoding="UTF-8"?>' +
      '<rss><channel><item><description>' +
      '&lt;img src=&quot;https://img.example/a.jpg&quot; srcset=&quot;https://img.example/a.jpg 1x, https://img.example/b.jpg 2x&quot;&gt;' +
      '&lt;a href=&quot;https://site.example/post-1&quot;&gt;go&lt;/a&gt;' +
      '</description>' +
      '<enclosure url="https://img.example/c.jpg" type="image/jpeg" />' +
      '</item></channel></rss>';

    const rewritten = await rewriteRssXmlResourceUrls({
      xml,
      requestProxyUrl: '',
      cacheSizeMb: 512,
    });

    expect(rewritten).toContain('src=&quot;/api/rss/resource-cache/key-a&quot;');
    expect(rewritten).toContain(
      'srcset=&quot;/api/rss/resource-cache/key-a 1x, /api/rss/resource-cache/key-b 2x&quot;'
    );
    expect(rewritten).toContain('<enclosure url="/api/rss/resource-cache/key-c" type="image/jpeg" />');
    expect(rewritten).toContain('&lt;a href=&quot;https://site.example/post-1&quot;&gt;go&lt;/a&gt;');
    expect(rewritten).not.toContain('https://img.example/a.jpg');
    expect(rewritten).not.toContain('https://img.example/b.jpg');
    expect(rewritten).not.toContain('https://img.example/c.jpg');
    expect(cacheRemoteResourceMock).not.toHaveBeenCalled();
    expect(getCachedResourceBySourceUrlMock).not.toHaveBeenCalledWith(
      expect.objectContaining({
        sourceUrl: 'https://site.example/post-1',
      })
    );
  });
});
