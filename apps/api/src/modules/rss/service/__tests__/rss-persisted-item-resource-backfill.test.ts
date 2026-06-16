import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { RssFeedItem } from '../../types/rss.types';
import { backfillPersistedRssItemResources } from '../rss-persisted-item-resource-backfill.service';

const { mapFeedItemRow, rewriteRssItemResourcesStrict, mergeUserRssFeedItems } = vi.hoisted(() => ({
  mapFeedItemRow: vi.fn(),
  rewriteRssItemResourcesStrict: vi.fn(),
  mergeUserRssFeedItems: vi.fn(),
}));

vi.mock('../rss-feed-item-persist.service', () => ({
  mapFeedItemRow,
}));

vi.mock('../rss-storage-resource.service', async importOriginal => {
  const actual = await importOriginal<typeof import('../rss-storage-resource.service')>();
  return {
    ...actual,
    rewriteRssItemResourcesStrict,
  };
});

vi.mock('../rss-feed-db.service', () => ({
  mergeUserRssFeedItems,
}));

const createItem = (overrides?: Partial<RssFeedItem>): RssFeedItem => ({
  id: 'item-id',
  title: 'Stored item',
  link: 'https://example.com/item',
  description: '',
  descriptionHtml: '',
  imageUrls: [],
  author: '',
  publishedAt: '2026-06-16T00:00:00.000Z',
  ...overrides,
});

describe('persisted rss item resource backfill', () => {
  beforeEach(() => {
    mapFeedItemRow.mockReset();
    rewriteRssItemResourcesStrict.mockReset();
    mergeUserRssFeedItems.mockReset();
  });

  it('updates a persisted item only when new local resources are written', async () => {
    const storedItem = createItem({
      id: 'origin-item-id',
      descriptionHtml: '<img src="https://cdn.example.com/a.png">',
      imageUrls: ['https://cdn.example.com/a.png'],
    });

    mapFeedItemRow.mockResolvedValue(storedItem);
    rewriteRssItemResourcesStrict.mockResolvedValue({
      item: createItem({
        id: 'origin-item-id',
        descriptionHtml: '<img src="/api/rss/dir/sub/item/a.png">',
        imageUrls: ['/api/rss/dir/sub/item/a.png'],
      }),
      resourceCount: 1,
      resourcesLocalized: true,
    });
    mergeUserRssFeedItems.mockResolvedValue({ inserted: 0, updated: 1, total: 1 });

    const result = await backfillPersistedRssItemResources({
      rows: [
        {
          dataValues: {
            item_key: 'stable-item-key',
          },
        },
      ],
      userId: 'user-1',
      route: '/tech',
      fetchedAt: '2026-06-16T01:00:00.000Z',
      requestProxyUrl: 'https://proxy.example.com',
    });

    expect(result.updatedCount).toBe(1);
    expect(mergeUserRssFeedItems).toHaveBeenCalledWith({
      userId: 'user-1',
      route: '/tech',
      fetchedAt: '2026-06-16T01:00:00.000Z',
      items: [
        expect.objectContaining({
          id: 'stable-item-key',
          itemId: 'origin-item-id',
          resourceCount: 1,
          resourcesLocalized: true,
          imageUrls: ['/api/rss/dir/sub/item/a.png'],
        }),
      ],
    });
  });

  it('skips merge when the persisted item still has no resource changes', async () => {
    const storedItem = createItem({
      id: 'origin-item-id',
      descriptionHtml: '<img src="/api/rss/dir/sub/item/a.png">',
      imageUrls: ['/api/rss/dir/sub/item/a.png'],
    });

    mapFeedItemRow.mockResolvedValue(storedItem);
    rewriteRssItemResourcesStrict.mockResolvedValue({
      item: storedItem,
      resourceCount: 1,
      resourcesLocalized: true,
    });

    const result = await backfillPersistedRssItemResources({
      rows: [
        {
          dataValues: {
            item_key: 'stable-item-key',
          },
        },
      ],
      userId: 'user-1',
      route: '/tech',
      fetchedAt: '2026-06-16T01:00:00.000Z',
      requestProxyUrl: 'https://proxy.example.com',
    });

    expect(result.updatedCount).toBe(0);
    expect(mergeUserRssFeedItems).not.toHaveBeenCalled();
  });

  it('skips rows already marked as fully localized before loading html content', async () => {
    const result = await backfillPersistedRssItemResources({
      rows: [
        {
          dataValues: {
            item_key: 'stable-item-key',
            resources_localized: true,
          },
        },
      ],
      userId: 'user-1',
      route: '/tech',
      fetchedAt: '2026-06-16T01:00:00.000Z',
      requestProxyUrl: 'https://proxy.example.com',
    });

    expect(result.updatedCount).toBe(0);
    expect(mapFeedItemRow).not.toHaveBeenCalled();
    expect(rewriteRssItemResourcesStrict).not.toHaveBeenCalled();
    expect(mergeUserRssFeedItems).not.toHaveBeenCalled();
  });
});
