import fs from 'fs';
import path from 'path';
import { badRequest } from '../../shared/http-handler';
import type { ClearRssStoragePayload } from '../types/rss.types';
import {
  clearAllUserRssFeedData,
  clearUserRssFeedDataByRoute,
  listUserRssSubscriptionStates,
} from './rss-feed-db.service';
import {
  clearRssItemFilesByRouteItemKeys,
  clearRssItemHtmlFilesByRoute,
  clearRssItemHtmlFilesByUser,
} from './rss-feed-item-html-file.service';
import { getRssFeedRootDirByUserId, getRssTaskRootDirByUserId } from './rss-storage-path.service';
import { countUserRssFeedItemsByRoute, trimUserRssFeedItemsByRoute } from './rss-feed-retention.service';

interface PendingFeedTaskMeta {
  userId: string;
  route: string;
}

const normalizeText = (value: string) => String(value || '').trim();

const ensureStorageDirs = async (userId: string) => {
  await fs.promises.mkdir(getRssTaskRootDirByUserId(userId), { recursive: true });
};

const listTaskFileNames = async (targetDir: string) => {
  return (await fs.promises.readdir(targetDir).catch(() => []))
    .filter(name => name.endsWith('.json'))
    .sort((a, b) => a.localeCompare(b));
};

const readTaskMeta = async (filePath: string): Promise<PendingFeedTaskMeta | null> => {
  try {
    const raw = await fs.promises.readFile(filePath, 'utf-8');
    const parsed = JSON.parse(raw) as Partial<PendingFeedTaskMeta>;
    const userId = normalizeText(String(parsed.userId || ''));
    const route = normalizeText(String(parsed.route || ''));
    if (!userId || !route) {
      return null;
    }
    return { userId, route };
  } catch {
    return null;
  }
};

const clearDirContents = async (targetDir: string) => {
  const stat = await fs.promises.stat(targetDir).catch(() => null);
  if (!stat?.isDirectory()) {
    return;
  }
  const entries = await fs.promises.readdir(targetDir).catch(() => []);
  await Promise.all(entries.map(name => fs.promises.rm(path.join(targetDir, name), { recursive: true, force: true })));
};

const clearDirIfExists = async (targetDir: string) => {
  await fs.promises.rm(targetDir, { recursive: true, force: true }).catch(() => undefined);
};

const removeQueueFilesByRoute = async (targetDir: string, userId: string, route: string) => {
  const fileNames = await listTaskFileNames(targetDir);
  await Promise.all(
    fileNames.map(async fileName => {
      const filePath = path.join(targetDir, fileName);
      const task = await readTaskMeta(filePath);
      if (!task || task.userId !== userId || task.route !== route) {
        return;
      }
      await fs.promises.rm(filePath, { force: true }).catch(() => undefined);
    })
  );
};

const parseKeepLatestItems = (payload?: ClearRssStoragePayload) => {
  const raw = Number(payload?.keepLatestItems);
  if (!Number.isFinite(raw)) {
    return 0;
  }
  return Math.max(0, Math.floor(raw));
};

const clearRssRouteHistory = async (params: {
  userId: string;
  route: string;
  keepState: boolean;
  keepLatestItems: number;
}) => {
  const normalizedUserId = normalizeText(params.userId);
  const normalizedRoute = normalizeText(params.route);
  const keepLatestItems = Math.max(0, Math.floor(Number(params.keepLatestItems || 0)));
  if (!normalizedUserId || !normalizedRoute) {
    return;
  }
  await removeQueueFilesByRoute(getRssTaskRootDirByUserId(normalizedUserId), normalizedUserId, normalizedRoute);
  if (keepLatestItems > 0) {
    const total = await countUserRssFeedItemsByRoute(normalizedUserId, normalizedRoute);
    if (keepLatestItems >= total) {
      badRequest('保留条数必须大于 0 且小于该订阅下 item 总条数');
    }
    const trimmed = await trimUserRssFeedItemsByRoute({
      userId: normalizedUserId,
      route: normalizedRoute,
      keepLatestItems,
    });
    await clearRssItemFilesByRouteItemKeys({
      userId: normalizedUserId,
      route: normalizedRoute,
      itemKeys: trimmed.removedItemKeys,
    });
    return;
  }

  await Promise.all([
    clearUserRssFeedDataByRoute(normalizedUserId, normalizedRoute, { keepState: params.keepState }),
    clearRssItemHtmlFilesByRoute({ userId: normalizedUserId, route: normalizedRoute }),
  ]);
};

const normalizeRouteListFromPayload = (payload?: ClearRssStoragePayload) => {
  const list = [
    String(payload?.route || '').trim(),
    ...(Array.isArray(payload?.routes) ? payload?.routes.map(item => String(item || '').trim()) : []),
  ].filter(Boolean);
  return Array.from(new Set(list));
};

export const clearRssSubscriptionStorageInternal = async (userId: string, route: string) => {
  await ensureStorageDirs(userId);
  await clearRssRouteHistory({ userId, route, keepState: false, keepLatestItems: 0 });
};

export const clearRssStorageInternal = async (userId: string, payload?: ClearRssStoragePayload) => {
  const normalizedUserId = normalizeText(userId);
  await ensureStorageDirs(normalizedUserId);
  const keepLatestItems = parseKeepLatestItems(payload);

  const scope = String(payload?.scope || 'all');
  if (scope === 'resource-cache' || scope === 'all') {
    await clearDirContents(getRssFeedRootDirByUserId(normalizedUserId));
  }
  if (scope === 'history' || scope === 'all') {
    const inputRoutes = normalizeRouteListFromPayload(payload);
    const subscribedRoutes = (await listUserRssSubscriptionStates(normalizedUserId))
      .map(item => normalizeText(String(item.route || '')))
      .filter(Boolean);
    const subscribedRouteSet = new Set(subscribedRoutes);
    const routes = inputRoutes.length > 0 ? inputRoutes : subscribedRoutes;

    await Promise.all(
      routes.map(route =>
        clearRssRouteHistory({
          userId: normalizedUserId,
          route,
          keepState: subscribedRouteSet.has(route),
          keepLatestItems,
        })
      )
    );
    if (routes.length === 0) {
      await Promise.all([clearAllUserRssFeedData(normalizedUserId), clearRssItemHtmlFilesByUser(normalizedUserId)]);
    }
  }
};
