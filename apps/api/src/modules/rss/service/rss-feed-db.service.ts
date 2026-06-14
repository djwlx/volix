import crypto from 'crypto';
import { Op, fn, col } from 'sequelize';
import { UserRssFeedItemModel } from '../model/rss-feed-item.model';
import { UserRssFeedStateModel } from '../model/rss-feed-state.model';
import type { RssFeedItem } from '../types/rss.types';
import { readRssItemHtmlFileByKey, writeRssItemHtmlFile } from './rss-feed-item-html-file.service';
import { buildFeedItemPersistPayload, buildItemSourceHash, mapFeedItemRow } from './rss-feed-item-persist.service';

interface MergeUserRssFeedItemsParams {
  userId: string;
  route: string;
  fetchedAt: string;
  items: Array<RssFeedItem & { resourceCount: number; itemId?: string }>;
}

interface UpsertUserRssFeedStateParams {
  userId: string;
  route: string;
  name: string;
  feedUrl: string;
  title: string;
  description: string;
  link: string;
  fetchedAt: string;
}

export interface UserRouteFeedCount {
  route: string;
  itemCount: number;
}

export interface UserRssSubscriptionStateRow {
  id: number;
  userId: string;
  route: string;
  name: string;
  feedUrl: string;
  enabled: boolean;
  lastFetchedAt?: string;
  lastProcessedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export const mergeUserRssFeedItems = async (params: MergeUserRssFeedItemsParams) => {
  const route = String(params.route || '').trim();
  const userId = String(params.userId || '').trim();
  if (!route || !userId) {
    return { inserted: 0, updated: 0, total: 0 };
  }
  const fetchedAt = String(params.fetchedAt || new Date().toISOString());
  const sourceItems = params.items || [];
  if (sourceItems.length === 0) {
    return { inserted: 0, updated: 0, total: 0 };
  }

  const itemKeys = sourceItems.map(item => String(item.id || '')).filter(Boolean);
  const existingRows = await UserRssFeedItemModel.findAll({
    where: {
      user_id: userId,
      route,
      item_key: {
        [Op.in]: itemKeys,
      },
    },
  });
  const existingMap = new Map<string, (typeof existingRows)[number]>();
  existingRows.forEach(row => {
    existingMap.set(String(row.dataValues.item_key || ''), row);
  });

  let inserted = 0;
  let updated = 0;
  for (const item of sourceItems) {
    const itemKey = String(item.id || '').trim();
    if (!itemKey) {
      continue;
    }
    const resourceCount = Math.max(0, Number(item.resourceCount || 0));
    const sourceHash = buildItemSourceHash(item, resourceCount);
    const existing = existingMap.get(itemKey);
    if (!existing) {
      const htmlFileKey = await writeRssItemHtmlFile({
        userId,
        route,
        itemKey,
        html: item.descriptionHtml,
      });
      await UserRssFeedItemModel.create({
        user_id: userId,
        route,
        item_key: itemKey,
        ...buildFeedItemPersistPayload(item, htmlFileKey || null, sourceHash, fetchedAt),
      });
      inserted += 1;
      continue;
    }

    const currentHash = String(existing.dataValues.source_hash || '');
    if (currentHash === sourceHash) {
      await existing.update({ fetched_at: fetchedAt });
      await existing.save();
      continue;
    }

    const htmlFileKey = await writeRssItemHtmlFile({
      userId,
      route,
      itemKey,
      html: item.descriptionHtml,
    });
    await existing.update({
      ...buildFeedItemPersistPayload(item, htmlFileKey || null, sourceHash, fetchedAt),
    });
    await existing.save();
    updated += 1;
  }

  const total = await UserRssFeedItemModel.count({
    where: {
      user_id: userId,
      route,
    },
  });
  return { inserted, updated, total };
};

export const upsertUserRssFeedState = async (params: UpsertUserRssFeedStateParams) => {
  const userId = String(params.userId || '').trim();
  const route = String(params.route || '').trim();
  if (!userId || !route) {
    return;
  }
  const current = await UserRssFeedStateModel.findOne({
    where: {
      user_id: userId,
      route,
    },
  });

  const sourceHash = crypto
    .createHash('sha256')
    .update(`${params.feedUrl}|${params.title}|${params.description}|${params.link}`)
    .digest('hex');
  const incomingName = String(params.name || '').trim();

  if (!current) {
    await UserRssFeedStateModel.create({
      user_id: userId,
      route,
      name: incomingName || route,
      feed_url: params.feedUrl,
      title: params.title,
      description: params.description,
      link: params.link,
      last_fetched_at: params.fetchedAt,
      last_processed_at: new Date().toISOString(),
      last_source_hash: sourceHash,
      is_subscribed: false,
      enabled: true,
    });
    return;
  }

  const currentName = String(current.dataValues.name || '').trim();
  const currentTitle = String(current.dataValues.title || '').trim();
  const shouldAutoUpdateName = !currentName || currentName === route || (currentTitle && currentName === currentTitle);
  const nextName = shouldAutoUpdateName ? incomingName || currentName || route : currentName;

  await current.update({
    name: nextName,
    feed_url: params.feedUrl,
    title: params.title,
    description: params.description,
    link: params.link,
    last_fetched_at: params.fetchedAt,
    last_processed_at: new Date().toISOString(),
    last_source_hash: sourceHash,
  });
  await current.save();
};

export const listUserRssSubscriptionStates = async (userId: string): Promise<UserRssSubscriptionStateRow[]> => {
  const normalizedUserId = String(userId || '').trim();
  if (!normalizedUserId) {
    return [];
  }
  const rows = await UserRssFeedStateModel.findAll({
    where: {
      user_id: normalizedUserId,
      is_subscribed: true,
    },
    order: [
      ['updated_at', 'DESC'],
      ['id', 'DESC'],
    ],
  });
  return rows.map(row => ({
    id: Number(row.dataValues.id || 0),
    userId: String(row.dataValues.user_id || ''),
    route: String(row.dataValues.route || ''),
    name: String(row.dataValues.name || ''),
    feedUrl: String(row.dataValues.feed_url || ''),
    enabled: row.dataValues.enabled !== false,
    lastFetchedAt: String(row.dataValues.last_fetched_at || ''),
    lastProcessedAt: String(row.dataValues.last_processed_at || ''),
    createdAt: row.dataValues.created_at,
    updatedAt: row.dataValues.updated_at,
  }));
};

export const listAllRssSubscriptionStates = async (): Promise<Array<{ userId: string; route: string }>> => {
  const rows = await UserRssFeedStateModel.findAll({
    attributes: ['user_id', 'route'],
    where: {
      is_subscribed: true,
      enabled: true,
    },
  });
  return rows
    .map(row => ({
      userId: String(row.dataValues.user_id || '').trim(),
      route: String(row.dataValues.route || '').trim(),
    }))
    .filter(item => item.userId && item.route);
};

export const upsertUserRssSubscriptionState = async (params: {
  userId: string;
  route: string;
  name: string;
  feedUrl: string;
}) => {
  const userId = String(params.userId || '').trim();
  const route = String(params.route || '').trim();
  const feedUrl = String(params.feedUrl || '').trim();
  if (!userId || !route || !feedUrl) {
    return null;
  }
  const name = String(params.name || '').trim();
  const current = await UserRssFeedStateModel.findOne({
    where: {
      user_id: userId,
      route,
    },
  });
  if (!current) {
    const created = await UserRssFeedStateModel.create({
      user_id: userId,
      route,
      name: name || route,
      feed_url: feedUrl,
      title: '',
      description: '',
      link: '',
      last_fetched_at: '',
      last_processed_at: '',
      last_source_hash: '',
      is_subscribed: true,
      enabled: true,
    });
    return created;
  }
  await current.update({
    name: name || current.dataValues.name || route,
    feed_url: String(current.dataValues.feed_url || '').trim() || feedUrl,
    is_subscribed: true,
    enabled: current.dataValues.enabled !== false,
  });
  await current.save();
  return current;
};

export const updateUserRssSubscriptionEnabled = async (userId: string, route: string, enabled: boolean) => {
  const normalizedUserId = String(userId || '').trim();
  const normalizedRoute = String(route || '').trim();
  if (!normalizedUserId || !normalizedRoute) {
    return null;
  }
  const current = await UserRssFeedStateModel.findOne({
    where: {
      user_id: normalizedUserId,
      route: normalizedRoute,
      is_subscribed: true,
    },
  });
  if (!current) {
    return null;
  }
  await current.update({
    enabled,
  });
  await current.save();
  return current;
};

export const isUserRssSubscriptionEnabled = async (userId: string, route: string) => {
  const normalizedUserId = String(userId || '').trim();
  const normalizedRoute = String(route || '').trim();
  if (!normalizedUserId || !normalizedRoute) {
    return true;
  }
  const current = await UserRssFeedStateModel.findOne({
    attributes: ['id', 'enabled', 'is_subscribed'],
    where: {
      user_id: normalizedUserId,
      route: normalizedRoute,
    },
  });
  if (!current || current.dataValues.is_subscribed !== true) {
    return true;
  }
  return current.dataValues.enabled !== false;
};

export const removeUserRssSubscriptionState = async (userId: string, route: string) => {
  const normalizedUserId = String(userId || '').trim();
  const normalizedRoute = String(route || '').trim();
  if (!normalizedUserId || !normalizedRoute) {
    return;
  }
  await UserRssFeedStateModel.destroy({
    where: {
      user_id: normalizedUserId,
      route: normalizedRoute,
    },
  });
};

export const getUserRssFeedState = async (userId: string, route: string) => {
  const row = await UserRssFeedStateModel.findOne({
    where: {
      user_id: String(userId || '').trim(),
      route: String(route || '').trim(),
    },
  });
  if (!row) {
    return null;
  }
  return {
    route: String(row.dataValues.route || ''),
    name: String(row.dataValues.name || ''),
    feedUrl: String(row.dataValues.feed_url || ''),
    title: String(row.dataValues.title || ''),
    description: String(row.dataValues.description || ''),
    link: String(row.dataValues.link || ''),
    fetchedAt: String(row.dataValues.last_fetched_at || row.dataValues.updated_at || new Date(0).toISOString()),
  };
};

export const listUserRssFeedItems = async (userId: string, route: string, limit = 300): Promise<RssFeedItem[]> => {
  const rows = await UserRssFeedItemModel.findAll({
    where: {
      user_id: String(userId || '').trim(),
      route: String(route || '').trim(),
    },
    order: [
      ['published_at', 'DESC'],
      ['updated_at', 'DESC'],
      ['id', 'DESC'],
    ],
    limit: Math.max(1, Math.min(2000, Math.floor(Number(limit || 0)) || 300)),
  });
  return Promise.all(rows.map(row => mapFeedItemRow(row, String(userId || '').trim())));
};

export const countUserRssFeedItemsByRoutes = async (
  userId: string,
  routes: string[]
): Promise<UserRouteFeedCount[]> => {
  const normalizedRoutes = Array.from(new Set(routes.map(item => String(item || '').trim()).filter(Boolean)));
  if (normalizedRoutes.length === 0) {
    return [];
  }
  const rows = await UserRssFeedItemModel.findAll({
    attributes: ['route', [fn('COUNT', col('id')), 'item_count']],
    where: {
      user_id: String(userId || '').trim(),
      route: {
        [Op.in]: normalizedRoutes,
      },
    },
    group: ['route'],
  });
  return rows.map(row => ({
    route: String(row.dataValues.route || ''),
    itemCount: Math.max(0, Number(((row.dataValues as unknown as Record<string, unknown>).item_count as number) || 0)),
  }));
};

export const clearUserRssFeedDataByRoute = async (userId: string, route: string, options?: { keepState?: boolean }) => {
  const normalizedUserId = String(userId || '').trim();
  const normalizedRoute = String(route || '').trim();
  if (!normalizedUserId || !normalizedRoute) {
    return;
  }
  await UserRssFeedItemModel.destroy({
    where: {
      user_id: normalizedUserId,
      route: normalizedRoute,
    },
  });
  if (options?.keepState) {
    await UserRssFeedStateModel.update(
      {
        title: '',
        description: '',
        link: '',
        last_fetched_at: '',
        last_processed_at: '',
        last_source_hash: '',
      },
      {
        where: {
          user_id: normalizedUserId,
          route: normalizedRoute,
        },
      }
    );
    return;
  }
  await UserRssFeedStateModel.destroy({
    where: {
      user_id: normalizedUserId,
      route: normalizedRoute,
    },
  });
};

export const clearAllUserRssFeedData = async (userId: string) => {
  const normalizedUserId = String(userId || '').trim();
  if (!normalizedUserId) {
    return;
  }
  await UserRssFeedItemModel.destroy({
    where: {
      user_id: normalizedUserId,
    },
  });
  await UserRssFeedStateModel.destroy({
    where: {
      user_id: normalizedUserId,
    },
  });
};

const CACHE_KEY_REGEX = /\/api\/rss\/resource-cache\/([a-f0-9]{64})/gi;

const extractCacheKeys = (value: string) => {
  const keys: string[] = [];
  const text = String(value || '');
  for (const match of text.matchAll(CACHE_KEY_REGEX)) {
    const key = String(match[1] || '')
      .trim()
      .toLowerCase();
    if (key) {
      keys.push(key);
    }
  }
  return keys;
};

export const listUserRssResourceCacheKeysByRoute = async (userId: string, route: string): Promise<string[]> => {
  const normalizedUserId = String(userId || '').trim();
  const normalizedRoute = String(route || '').trim();
  if (!normalizedUserId || !normalizedRoute) {
    return [];
  }

  const rows = await UserRssFeedItemModel.findAll({
    attributes: ['description_html', 'description_html_file_key', 'image_urls'],
    where: {
      user_id: normalizedUserId,
      route: normalizedRoute,
    },
  });

  const keySet = new Set<string>();
  for (const row of rows) {
    const htmlFileKey = String(row.dataValues.description_html_file_key || '').trim();
    const fileHtml = htmlFileKey ? await readRssItemHtmlFileByKey({ userId: normalizedUserId, key: htmlFileKey }) : '';
    extractCacheKeys(fileHtml || String(row.dataValues.description_html || '')).forEach(key => keySet.add(key));
    extractCacheKeys(String(row.dataValues.image_urls || '')).forEach(key => keySet.add(key));
  }
  return Array.from(keySet);
};
