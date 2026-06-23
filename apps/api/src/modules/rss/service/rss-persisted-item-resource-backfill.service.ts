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

const DEFAULT_RESOURCE_DOWNLOAD_MAX_RETRY = 10;

export const backfillPersistedRssItemResources = async (params: {
  rows: Array<{ dataValues: Record<string, any>; update?: (values: Record<string, unknown>) => Promise<unknown> }>;
  userId: string;
  route: string;
  fetchedAt: string;
  requestProxyUrl: string;
  maxResourceRetry?: number;
}) => {
  let updatedCount = 0;
  const maxResourceRetry = Number.isFinite(Number(params.maxResourceRetry))
    ? Number(params.maxResourceRetry)
    : DEFAULT_RESOURCE_DOWNLOAD_MAX_RETRY;

  await mapWithConcurrencyLimited(params.rows, 3, async row => {
    const itemKey = String(row.dataValues.item_key || '').trim();
    if (!itemKey || row.dataValues.resources_localized === true) {
      return;
    }

    const attempts = Math.max(0, Math.floor(Number(row.dataValues.resource_download_attempts || 0)));
    if (maxResourceRetry > 0 && attempts >= maxResourceRetry) {
      return;
    }

    const storedItem = await mapFeedItemRow(row, params.userId);
    const rewritten = await rewriteRssItemResourcesStrict(storedItem, {
      userId: params.userId,
      route: params.route,
      itemKey,
      requestProxyUrl: params.requestProxyUrl,
    });

    if (hasResourceRewriteChanges(storedItem, rewritten.item)) {
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
            resourcesLocalized: rewritten.resourcesLocalized,
          },
        ],
      });
      updatedCount += 1;
    }

    if (!rewritten.resourcesLocalized && typeof row.update === 'function') {
      await row.update({ resource_download_attempts: attempts + 1 });
    }
  });

  return {
    updatedCount,
  };
};
