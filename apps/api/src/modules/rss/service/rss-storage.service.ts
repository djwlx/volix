import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { Op } from 'sequelize';
import { PATH } from '../../../utils/path';
import { log } from '../../../utils/logger';
import { badRequest } from '../../shared/http-handler';
import type {
  ClearRssStoragePayload,
  RssFeedPayload,
  RssFeedItem,
  RssPathUsageStat,
  RssStorageStatusPayload,
  UserRssSettingPayload,
} from '../types/rss.types';
import { buildRssItemStableKey, parseRssFeedItemsFromXml } from './rss-feed-item-parser.service';
import { mapWithConcurrencyLimited, rewriteRssItemResourcesStrict } from './rss-storage-resource.service';
import { prunePendingTasksBySubscriptions } from './rss-storage-queue-guard.service';
import { clearRssStorageInternal, clearRssSubscriptionStorageInternal } from './rss-storage-cleanup.service';
import { UserRssFeedItemModel } from '../model/rss-feed-item.model';
import { queryUser } from '../../user/service/user.service';
import {
  countUserRssFeedItemsByRoutes,
  getUserRssFeedState,
  isUserRssSubscriptionEnabled,
  listAllRssSubscriptionStates,
  listUserRssSubscriptionStates,
  listUserRssFeedItems,
  mergeUserRssFeedItems,
  upsertUserRssFeedState,
} from './rss-feed-db.service';
import { getRssSubscriptionDirPath } from './rss-feed-item-html-file.service';
import { readRssFeedSubscriptionMeta, writeRssFeedSubscriptionMeta } from './rss-feed-subscription-meta.service';
import { getRssFeedRootDirByUserId, getRssTaskRootDirByUserId } from './rss-storage-path.service';
import {
  addMinutesToIsoTime,
  getPathUsage,
  normalizeIsoTime,
  parseRefreshIntervalMinutes,
} from './rss-storage-status-utils.service';
import { parseUserRssConfig } from './rss-user-config.service';
import { backfillPersistedRssItemResources } from './rss-persisted-item-resource-backfill.service';
import { readTaskRouteMeta } from './rss-storage-route-meta.service';
interface PendingFeedTask {
  userId: string;
  route: string;
  routeName: string;
  feedUrl: string;
  contentType: string;
  xml: string;
  fetchedAt: string;
  requestProxyUrl: string;
  retries: number;
  lastError: string;
  updatedAtMs: number;
}

interface PendingFeedTaskEnqueueInput {
  userId: string;
  route: string;
  routeName: string;
  payload: RssFeedPayload;
  setting: Pick<UserRssSettingPayload, 'resourceProxyBaseUrl'>;
}
const TASK_MAX_RETRY = 10;
let queueRunning = false;
let queueJob: Promise<void> | null = null;
const getPendingDir = (userId: string) => getRssTaskRootDirByUserId(userId);
const ensureStorageDirs = async (userId: string) => fs.promises.mkdir(getPendingDir(userId), { recursive: true });
const normalizeText = (value: string) => String(value || '').trim();
const getFeedTaskKey = (userId: string, route: string, feedUrl: string) => {
  return crypto
    .createHash('sha256')
    .update(`${normalizeText(userId)}|${normalizeText(route)}|${normalizeText(feedUrl)}`)
    .digest('hex');
};
const enqueueTaskFilePath = (task: { userId: string; route: string; feedUrl: string }) =>
  path.join(getPendingDir(task.userId), `${Date.now()}-${getFeedTaskKey(task.userId, task.route, task.feedUrl)}.json`);
const readPendingTask = async (filePath: string): Promise<PendingFeedTask | null> => {
  try {
    const raw = await fs.promises.readFile(filePath, 'utf-8');
    const parsed = JSON.parse(raw) as Partial<PendingFeedTask>;
    const userId = normalizeText(String(parsed.userId || ''));
    const route = normalizeText(String(parsed.route || ''));
    const feedUrl = normalizeText(String(parsed.feedUrl || ''));
    const xml = String(parsed.xml || '');
    if (!userId || !route || !feedUrl || !xml.trim()) {
      return null;
    }
    return {
      userId,
      route,
      routeName: normalizeText(String(parsed.routeName || route)) || route,
      feedUrl,
      contentType: String(parsed.contentType || 'application/xml'),
      xml,
      fetchedAt: String(parsed.fetchedAt || new Date().toISOString()),
      requestProxyUrl: String(parsed.requestProxyUrl || ''),
      retries: Math.max(0, Math.floor(Number(parsed.retries || 0))),
      lastError: String(parsed.lastError || ''),
      updatedAtMs: Number(parsed.updatedAtMs || Date.now()),
    };
  } catch {
    return null;
  }
};
const writePendingTask = async (filePath: string, task: PendingFeedTask) => {
  await fs.promises.writeFile(filePath, JSON.stringify(task), 'utf-8');
};
const processSingleTask = async (taskFilePath: string) => {
  const task = await readPendingTask(taskFilePath);
  if (!task) {
    await fs.promises.rm(taskFilePath, { force: true }).catch(() => undefined);
    return;
  }
  const autoRefreshEnabled = await isUserRssSubscriptionEnabled(task.userId, task.route);
  if (!autoRefreshEnabled) {
    await fs.promises.rm(taskFilePath, { force: true }).catch(() => undefined);
    return;
  }
  try {
    const parsed = parseRssFeedItemsFromXml(task.xml);
    const keyedItems = Array.from(
      new Map(
        (parsed.items || []).map(item => {
          const stableKey = buildRssItemStableKey(item);
          return [stableKey, { ...item, id: stableKey, itemId: item.id }];
        })
      ).values()
    );
    const itemKeys = keyedItems.map(item => String(item.id || '')).filter(Boolean);
    const existingRows =
      itemKeys.length === 0
        ? []
        : await UserRssFeedItemModel.findAll({
            where: { user_id: task.userId, route: task.route, item_key: { [Op.in]: itemKeys } },
          });
    const existingKeySet = new Set(existingRows.map(item => String(item.dataValues.item_key || '')));
    const newItems = keyedItems.filter(item => !existingKeySet.has(String(item.id || '')));
    let insertedCount = 0;
    await mapWithConcurrencyLimited(newItems, 3, async item => {
      const originalItemId = String(item.itemId || item.id || '');
      const rewritten = await rewriteRssItemResourcesStrict(item, {
        requestProxyUrl: task.requestProxyUrl,
        userId: task.userId,
        route: task.route,
        itemKey: String(item.id || ''),
      });
      const upsertItem: RssFeedItem & { resourceCount: number; itemId?: string } = {
        ...rewritten.item,
        id: String(item.id || ''),
        itemId: originalItemId,
        resourceCount: rewritten.resourceCount,
      };
      const merged = await mergeUserRssFeedItems({
        userId: task.userId,
        route: task.route,
        fetchedAt: task.fetchedAt,
        items: [upsertItem],
      });
      insertedCount += Number(merged.inserted || 0);
    });
    await backfillPersistedRssItemResources({
      rows: existingRows,
      userId: task.userId,
      route: task.route,
      fetchedAt: task.fetchedAt,
      requestProxyUrl: task.requestProxyUrl,
    });
    await upsertUserRssFeedState({
      userId: task.userId,
      route: task.route,
      name: String(parsed.title || '').trim() || String(task.routeName || '').trim() || task.route,
      feedUrl: task.feedUrl,
      title: parsed.title,
      description: parsed.description,
      link: parsed.link,
      fetchedAt: task.fetchedAt,
    });
    await writeRssFeedSubscriptionMeta(
      { userId: task.userId, route: task.route },
      { lastUpdatedAt: new Date().toISOString(), lastFetchedAt: task.fetchedAt, lastNewCount: insertedCount }
    );
    await fs.promises.rm(taskFilePath, { force: true }).catch(() => undefined);
  } catch (error) {
    const retries = task.retries + 1;
    const message = error instanceof Error ? error.message : String(error);
    if (retries >= TASK_MAX_RETRY) {
      log.warn('[rss-storage] 队列任务超出重试次数，丢弃任务', {
        userId: task.userId,
        route: task.route,
        feedUrl: task.feedUrl,
        retries,
        message,
      });
      await fs.promises.rm(taskFilePath, { force: true }).catch(() => undefined);
      return;
    }
    await writePendingTask(taskFilePath, {
      ...task,
      retries,
      lastError: message.slice(0, 500),
      updatedAtMs: Date.now(),
    });
  }
};
const listTaskFileNames = async (targetDir: string) => {
  return (await fs.promises.readdir(targetDir).catch(() => []))
    .filter(name => name.endsWith('.json'))
    .sort((a, b) => a.localeCompare(b));
};

const runPendingQueue = async () => {
  const subscriptions = await listAllRssSubscriptionStates();
  const userIdList = Array.from(
    new Set(subscriptions.map(item => normalizeText(String(item.userId || ''))).filter(Boolean))
  );
  for (const userId of userIdList) {
    await ensureStorageDirs(userId);
    const pendingDir = getPendingDir(userId);
    const rawTaskFileNames = await listTaskFileNames(pendingDir);
    const taskFileNames = await prunePendingTasksBySubscriptions({
      dirPath: pendingDir,
      taskFileNames: rawTaskFileNames,
    });
    for (const taskFileName of taskFileNames) {
      await processSingleTask(path.join(pendingDir, taskFileName));
    }
  }
};
export const startRssPendingQueue = () => {
  if (queueJob) {
    return queueJob;
  }
  queueRunning = true;
  queueJob = runPendingQueue()
    .catch(error => {
      log.warn('[rss-storage] 队列处理失败', {
        error: error instanceof Error ? error.message : String(error),
      });
    })
    .finally(() => {
      queueRunning = false;
      queueJob = null;
    });
  return queueJob;
};
export const enqueueRssFeedProcessingTask = async (params: PendingFeedTaskEnqueueInput) => {
  const userId = normalizeText(params.userId);
  const route = normalizeText(params.route);
  const routeName = normalizeText(params.routeName || route) || route;
  const feedUrl = normalizeText(params.payload.feedUrl);
  const xml = String(params.payload.xml || '');
  if (!userId || !route || !feedUrl || !xml.trim()) {
    return;
  }

  await ensureStorageDirs(userId);
  const taskKeySuffix = `-${getFeedTaskKey(userId, route, feedUrl)}.json`;
  const pendingDir = getPendingDir(userId);
  const existing = await listTaskFileNames(pendingDir);
  const sameKeyFiles = existing.filter(name => name.endsWith(taskKeySuffix));
  if (sameKeyFiles.length > 0) {
    await Promise.all(
      sameKeyFiles.map(fileName =>
        fs.promises.rm(path.join(pendingDir, fileName), { force: true }).catch(() => undefined)
      )
    );
  }

  const filePath = enqueueTaskFilePath({ userId, route, feedUrl });
  const task: PendingFeedTask = {
    userId,
    route,
    routeName,
    feedUrl,
    contentType: String(params.payload.contentType || 'application/xml'),
    xml,
    fetchedAt: String(params.payload.fetchedAt || new Date().toISOString()),
    requestProxyUrl: String(params.setting.resourceProxyBaseUrl || ''),
    retries: 0,
    lastError: '',
    updatedAtMs: Date.now(),
  };
  await writePendingTask(filePath, task);
  void startRssPendingQueue();
};

export const hasPendingRssFeedTask = async (params: { userId: string; route: string; feedUrl: string }) => {
  const userId = normalizeText(params.userId);
  const route = normalizeText(params.route);
  const feedUrl = normalizeText(params.feedUrl);
  if (!userId || !route || !feedUrl) {
    return false;
  }
  await ensureStorageDirs(userId);
  const taskKeySuffix = `-${getFeedTaskKey(userId, route, feedUrl)}.json`;
  const taskFileNames = await listTaskFileNames(getPendingDir(userId));
  return taskFileNames.some(name => name.endsWith(taskKeySuffix));
};

export const getProcessedRssFeedPayload = async (params: {
  userId: string;
  route: string;
}): Promise<RssFeedPayload | null> => {
  const userId = normalizeText(params.userId);
  const route = normalizeText(params.route);
  if (!userId || !route) {
    return null;
  }
  const [state, items] = await Promise.all([getUserRssFeedState(userId, route), listUserRssFeedItems(userId, route)]);
  if (!state) {
    return null;
  }
  return {
    feedUrl: state.feedUrl,
    contentType: 'application/rss+xml',
    fetchedAt: state.fetchedAt,
    xml: `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>${String(state.title || '').replace(
      /&/g,
      '&amp;'
    )}</title></channel></rss>`,
    title: state.title,
    description: state.description,
    link: state.link,
    items,
  };
};

export const getRssPendingFeedPlaceholder = (feedUrl: string): RssFeedPayload => {
  const escapedFeedUrl = String(feedUrl || '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;');
  return {
    feedUrl,
    contentType: 'application/rss+xml',
    fetchedAt: new Date().toISOString(),
    xml: `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>RSS 正在处理</title><description>该订阅正在下载静态资源并入库，请稍后刷新。</description><link>${escapedFeedUrl}</link></channel></rss>`,
    title: 'RSS 正在处理',
    description: '该订阅正在下载静态资源并入库，请稍后刷新。',
    link: feedUrl,
    items: [],
  };
};

export const getRssStorageStatus = async (userId: string): Promise<RssStorageStatusPayload> => {
  const normalizedUserId = normalizeText(userId);
  if (!normalizedUserId) {
    badRequest('缺少用户信息');
  }

  await ensureStorageDirs(normalizedUserId);
  const pathList: Array<{ key: string; label: string; path: string }> = [
    { key: 'sqlite', label: 'SQLite 数据库', path: PATH.database },
    { key: 'rssFeed', label: 'RSS 缓存目录', path: getRssFeedRootDirByUserId(normalizedUserId) },
  ];

  const [pathStats, subscriptions, pendingRouteMeta, userSetting] = await Promise.all([
    Promise.all(
      pathList.map(async item => {
        const usage = await getPathUsage(item.path);
        return {
          ...item,
          ...usage,
        };
      })
    ),
    listUserRssSubscriptionStates(normalizedUserId),
    readTaskRouteMeta({
      targetDir: getPendingDir(normalizedUserId),
      userId: normalizedUserId,
      listTaskFileNames,
      readPendingTask,
    }),
    queryUser({
      id: normalizedUserId,
    }),
  ]);

  const routeToNameMap = new Map<string, string>();
  subscriptions.forEach(item => {
    const route = normalizeText(String(item.route || ''));
    const name = normalizeText(String(item.name || route)) || route;
    if (!route) {
      return;
    }
    routeToNameMap.set(route, name);
  });

  const pendingCountMap = new Map<string, number>();
  pendingRouteMeta.forEach(item => {
    pendingCountMap.set(item.route, Number(pendingCountMap.get(item.route) || 0) + Number(item.itemCount || 0));
    if (!routeToNameMap.has(item.route)) {
      routeToNameMap.set(item.route, item.routeName || item.route);
    }
  });

  const routeList = Array.from(routeToNameMap.keys());
  const itemCountList = await countUserRssFeedItemsByRoutes(normalizedUserId, routeList);
  const itemCountMap = new Map(itemCountList.map(item => [item.route, item.itemCount]));
  const userRssConfig = parseUserRssConfig(userSetting?.dataValues.rss_config);
  const refreshIntervalMinutes = parseRefreshIntervalMinutes(userRssConfig.refreshIntervalMinutes);

  const routes = await Promise.all(
    routeList.map(async route => {
      const currentState = subscriptions.find(item => item.route === route);
      const routeMeta = await readRssFeedSubscriptionMeta({
        userId: normalizedUserId,
        route,
      });
      const lastUpdatedAt = normalizeIsoTime(
        routeMeta?.lastUpdatedAt ||
          currentState?.lastProcessedAt ||
          currentState?.lastFetchedAt ||
          currentState?.updatedAt ||
          ''
      );
      const storageUsage = await getPathUsage(
        getRssSubscriptionDirPath({
          userId: normalizedUserId,
          route,
        })
      );
      return {
        route,
        name: routeToNameMap.get(route) || route,
        pendingCount: Number(pendingCountMap.get(route) || 0),
        itemCount: Number(itemCountMap.get(route) || 0),
        lastUpdatedAt,
        lastNewCount: Math.max(0, Number(routeMeta?.lastNewCount || 0)),
        nextUpdateAt: currentState?.enabled === false ? '' : addMinutesToIsoTime(lastUpdatedAt, refreshIntervalMinutes),
        storageSizeBytes: Math.max(0, Number(storageUsage.sizeBytes || 0)),
        storageFileCount: Math.max(0, Number(storageUsage.fileCount || 0)),
      };
    })
  );

  const pendingItemCount = pendingRouteMeta.reduce((acc, item) => acc + Number(item.itemCount || 0), 0);
  const totalSizeBytes = pathStats.reduce((acc, item) => acc + item.sizeBytes, 0);

  return {
    queue: {
      pendingCount: pendingItemCount,
      running: queueRunning,
    },
    routes,
    paths: pathStats as RssPathUsageStat[],
    totalSizeBytes,
  };
};

export const clearRssSubscriptionStorage = async (userId: string, route: string) => {
  await clearRssSubscriptionStorageInternal(normalizeText(userId), normalizeText(route));
  return getRssStorageStatus(userId);
};
export const clearRssStorage = async (userId: string, payload?: ClearRssStoragePayload) => {
  const scope = String(payload?.scope || 'all');
  if (!['resource-cache', 'history', 'all'].includes(scope)) {
    badRequest('scope 仅支持 resource-cache、history、all');
  }
  if (payload && Object.prototype.hasOwnProperty.call(payload, 'keepLatestItems')) {
    const keepLatestItems = Number(payload.keepLatestItems);
    if (!Number.isFinite(keepLatestItems) || keepLatestItems <= 0) {
      badRequest('keepLatestItems 必须大于 0');
    }
  }
  const normalizedUserId = normalizeText(userId);
  if (!normalizedUserId) {
    badRequest('缺少用户信息');
  }
  await clearRssStorageInternal(normalizedUserId, payload);
  return getRssStorageStatus(normalizedUserId);
};
