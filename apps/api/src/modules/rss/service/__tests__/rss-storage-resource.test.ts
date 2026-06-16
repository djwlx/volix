import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { RssFeedItem } from '../../types/rss.types';
import { rewriteRssItemResourcesStrict } from '../rss-storage-resource.service';

const { downloadRssItemResource } = vi.hoisted(() => ({
  downloadRssItemResource: vi.fn(),
}));

vi.mock('../rss-item-resource.service', () => ({
  downloadRssItemResource,
}));

const createItem = (overrides?: Partial<RssFeedItem>): RssFeedItem => ({
  id: 'item-1',
  title: 'Item 1',
  link: 'https://example.com/item-1',
  description: '',
  descriptionHtml: '',
  imageUrls: [],
  author: '',
  publishedAt: '2026-06-16T00:00:00.000Z',
  ...overrides,
});

describe('rss storage resource rewrite', () => {
  beforeEach(() => {
    downloadRssItemResource.mockReset();
  });

  it('keeps failed origin urls on first import and counts only localized resources', async () => {
    downloadRssItemResource.mockImplementation(async ({ sourceUrl }: { sourceUrl: string }) => {
      if (sourceUrl.endsWith('/ok.png')) {
        return {
          ok: true,
          url: '/api/rss/dir/sub/item/ok.png',
        } as const;
      }
      return {
        ok: false,
        url: sourceUrl,
      } as const;
    });

    const result = await rewriteRssItemResourcesStrict(
      createItem({
        descriptionHtml:
          '<p><img src="https://cdn.example.com/ok.png"><img src="https://cdn.example.com/fail.png"></p>',
        imageUrls: ['https://cdn.example.com/ok.png', 'https://cdn.example.com/fail.png'],
      }),
      {
        userId: 'user-1',
        route: '/tech',
        itemKey: 'item-1',
        requestProxyUrl: 'https://proxy.example.com',
      }
    );

    expect(result.item.descriptionHtml).toContain('/api/rss/dir/sub/item/ok.png');
    expect(result.item.descriptionHtml).toContain('https://cdn.example.com/fail.png');
    expect(result.item.imageUrls).toEqual(['/api/rss/dir/sub/item/ok.png', 'https://cdn.example.com/fail.png']);
    expect(result.resourceCount).toBe(1);
  });

  it('backfills only remote resources for persisted items and returns the total localized count', async () => {
    downloadRssItemResource.mockResolvedValue({
      ok: true,
      url: '/api/rss/dir/sub/item/new.png',
    } as const);

    const result = await rewriteRssItemResourcesStrict(
      createItem({
        descriptionHtml:
          '<p><img src="/api/rss/dir/sub/item/cached.png"><img src="https://cdn.example.com/new.png"></p>',
        imageUrls: ['/api/rss/dir/sub/item/cached.png', 'https://cdn.example.com/new.png'],
      }),
      {
        userId: 'user-1',
        route: '/tech',
        itemKey: 'item-1',
        requestProxyUrl: 'https://proxy.example.com',
      }
    );

    expect(downloadRssItemResource).toHaveBeenCalledTimes(1);
    expect(downloadRssItemResource).toHaveBeenCalledWith(
      expect.objectContaining({
        sourceUrl: 'https://cdn.example.com/new.png',
      })
    );
    expect(result.item.descriptionHtml).toContain('/api/rss/dir/sub/item/cached.png');
    expect(result.item.descriptionHtml).toContain('/api/rss/dir/sub/item/new.png');
    expect(result.item.imageUrls).toEqual(['/api/rss/dir/sub/item/cached.png', '/api/rss/dir/sub/item/new.png']);
    expect(result.resourceCount).toBe(2);
  });
});
