import type { RssFeedItem } from '../types/rss.types';
import { mergeUserRssFeedItems } from './rss-feed-db.service';
import { mapFeedItemRow } from './rss-feed-item-persist.service';
import { mapWithConcurrencyLimited, rewriteRssItemResourcesStrict } from './rss-storage-resource.service';

const hasResourceRewriteChanges = (before: RssFeedItem, after: RssFeedItem) => {
  if (String(before.descriptionHtml || '') !== String(after.descriptionHtml || '')) {
    return true;
  }

  const beforeImages = before.imageUrls || [];
  const afterImages = after.imageUrls || [];
  if (beforeImages.length !== afterImages.length) {
    return true;
  }

  return beforeImages.some((value, index) => value !== afterImages[index]);
};

export const backfillPersistedRssItemResources = async (params: {
  rows: Array<{ dataValues: Record<string, any> }>;
  userId: string;
  route: string;
  fetchedAt: string;
  requestProxyUrl: string;
}) => {
  let updatedCount = 0;

  await mapWithConcurrencyLimited(params.rows, 3, async row => {
    const itemKey = String(row.dataValues.item_key || '').trim();
    if (!itemKey) {
      return;
    }

    const storedItem = await mapFeedItemRow(row, params.userId);
    const rewritten = await rewriteRssItemResourcesStrict(storedItem, {
      userId: params.userId,
      route: params.route,
      itemKey,
      requestProxyUrl: params.requestProxyUrl,
    });

    if (!hasResourceRewriteChanges(storedItem, rewritten.item)) {
      return;
    }

    await mergeUserRssFeedItems({
      userId: params.userId,
      route: params.route,
      fetchedAt: params.fetchedAt,
      items: [
        {
          ...rewritten.item,
          id: itemKey,
          itemId: storedItem.id || itemKey,
          resourceCount: rewritten.resourceCount,
        },
      ],
    });
    updatedCount += 1;
  });

  return {
    updatedCount,
  };
};
