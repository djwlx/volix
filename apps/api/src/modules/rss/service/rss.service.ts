import request from '../../../utils/request';
import { log } from '../../../utils/logger';
import { badRequest } from '../../shared/http-handler';
import {
  parseResourceCacheSizeMb,
  parseResourceProxyBaseUrl,
} from '../../shared/service/remote-resource-fetch.service';
import { queryUser, updateUser } from '../../user/service/user.service';
import { parseRssFeedItemsFromXml } from './rss-feed-item-parser.service';
import {
  isUserRssSubscriptionEnabled,
  listUserRssSubscriptionStates,
  removeUserRssSubscriptionState,
  updateUserRssSubscriptionEnabled,
  upsertUserRssSubscriptionState,
} from './rss-feed-db.service';
import {
  clearRssStorage,
  clearRssSubscriptionStorage,
  enqueueRssFeedProcessingTask,
  getProcessedRssFeedPayload,
  hasPendingRssFeedTask,
  getRssPendingFeedPlaceholder,
  getRssStorageStatus,
  startRssPendingQueue,
} from './rss-storage.service';
import type {
  ClearRssStoragePayload,
  CreateUserRssSubscriptionPayload,
  GetRssFeedParams,
  RssStorageStatusPayload,
  RssFeedPayload,
  UpdateUserRssSettingPayload,
  UpdateUserRssSubscriptionEnabledPayload,
  UserRssSettingPayload,
  UserRssSubscriptionItem,
} from '../types/rss.types';
import type { AxiosError, AxiosResponse } from 'axios';
import { parseUserRssConfig } from './rss-user-config.service';
import { t } from '../../../utils/i18n';
import { getCurrentUserId, mapSubscriptionItem, normalizeSubscriptionName } from './rss-subscription-utils.service';
import { emitRssStorageChanged } from './rss-realtime.service';
import {
  isAbsoluteHttpUrl,
  normalizeAbsoluteUrl,
  normalizeHost,
  normalizeSubscriptionRoute,
} from './rss-source.service';
const DEFAULT_RSS_HUB = 'https://rsshub.app';
const DEFAULT_RESOURCE_PROXY_BASE_URL = '';
const DEFAULT_RESOURCE_CACHE_SIZE_MB = 0;
const DEFAULT_REFRESH_INTERVAL_MINUTES = 5;
const MIN_REFRESH_INTERVAL_MINUTES = 1;
const MAX_REFRESH_INTERVAL_MINUTES = 24 * 60;
const DEFAULT_RESOURCE_DOWNLOAD_MAX_RETRY = 10;
const MIN_RESOURCE_DOWNLOAD_MAX_RETRY = 0;
const MAX_RESOURCE_DOWNLOAD_MAX_RETRY = 100;
const rssFeedRefreshJobMap = new Map<string, Promise<void>>();
const normalizeResourceProxyBaseUrl = (value: string): string => {
  const trimmed = String(value || '').trim();
  if (!trimmed) {
    return '';
  }
  const normalized = parseResourceProxyBaseUrl(trimmed);
  if (!normalized) {
    badRequest(t('rssApi.resourceProxy.invalid'));
  }
  return normalized;
};
const normalizeResourceCacheSizeMb = (value: number | undefined): number => {
  return parseResourceCacheSizeMb(Number(value), DEFAULT_RESOURCE_CACHE_SIZE_MB);
};
const normalizeRefreshIntervalMinutes = (value: number | undefined): number => {
  const raw = Number(value);
  if (!Number.isFinite(raw)) {
    return DEFAULT_REFRESH_INTERVAL_MINUTES;
  }
  return Math.min(MAX_REFRESH_INTERVAL_MINUTES, Math.max(MIN_REFRESH_INTERVAL_MINUTES, Math.round(raw)));
};
const normalizeResourceDownloadMaxRetry = (value: number | undefined): number => {
  const raw = Number(value);
  if (!Number.isFinite(raw)) {
    return DEFAULT_RESOURCE_DOWNLOAD_MAX_RETRY;
  }
  return Math.min(MAX_RESOURCE_DOWNLOAD_MAX_RETRY, Math.max(MIN_RESOURCE_DOWNLOAD_MAX_RETRY, Math.round(raw)));
};
const parseForceRefreshFlag = (value: unknown): boolean => {
  if (typeof value === 'boolean') {
    return value;
  }
  const text = String(value || '')
    .trim()
    .toLowerCase();
  return text === '1' || text === 'true' || text === 'yes';
};

export async function getUserRssSetting(userId: string | number | undefined): Promise<UserRssSettingPayload> {
  const normalizedUserId = getCurrentUserId(userId);
  const setting = await queryUser({ id: normalizedUserId });
  const rssConfig = parseUserRssConfig(setting?.dataValues.rss_config);
  return {
    host: normalizeHost(String(rssConfig.host || DEFAULT_RSS_HUB)),
    resourceProxyBaseUrl: normalizeResourceProxyBaseUrl(
      String(rssConfig.resourceProxyBaseUrl || DEFAULT_RESOURCE_PROXY_BASE_URL)
    ),
    resourceCacheMaxSizeMb: normalizeResourceCacheSizeMb(Number(rssConfig.resourceCacheMaxSizeMb || 0)),
    refreshIntervalMinutes: normalizeRefreshIntervalMinutes(Number(rssConfig.refreshIntervalMinutes || 0)),
    resourceDownloadMaxRetry: normalizeResourceDownloadMaxRetry(rssConfig.resourceDownloadMaxRetry),
  };
}
export async function updateUserRssSetting(
  userId: string | number | undefined,
  payload: UpdateUserRssSettingPayload
): Promise<UserRssSettingPayload> {
  const normalizedUserId = getCurrentUserId(userId);
  const host = normalizeHost(payload?.host || '');
  const resourceProxyBaseUrl = normalizeResourceProxyBaseUrl(payload?.resourceProxyBaseUrl || '');
  const resourceCacheMaxSizeMb = normalizeResourceCacheSizeMb(payload?.resourceCacheMaxSizeMb);
  const refreshIntervalMinutes = normalizeRefreshIntervalMinutes(payload?.refreshIntervalMinutes);
  const resourceDownloadMaxRetry = normalizeResourceDownloadMaxRetry(payload?.resourceDownloadMaxRetry);
  await updateUser(normalizedUserId, {
    rss_config: JSON.stringify({
      host,
      resourceProxyBaseUrl,
      resourceCacheMaxSizeMb,
      refreshIntervalMinutes,
      resourceDownloadMaxRetry,
    }),
  });
  return { host, resourceProxyBaseUrl, resourceCacheMaxSizeMb, refreshIntervalMinutes, resourceDownloadMaxRetry };
}
export async function listUserRssSubscriptions(
  userId: string | number | undefined
): Promise<UserRssSubscriptionItem[]> {
  const normalizedUserId = getCurrentUserId(userId);
  const rows = await listUserRssSubscriptionStates(normalizedUserId);
  return rows.map(row => mapSubscriptionItem(row));
}
export async function createUserRssSubscription(
  userId: string | number | undefined,
  payload: CreateUserRssSubscriptionPayload
): Promise<UserRssSubscriptionItem> {
  const normalizedUserId = getCurrentUserId(userId);
  const route = normalizeSubscriptionRoute(payload?.route || '');
  const existingRows = await listUserRssSubscriptionStates(normalizedUserId);
  const existed = existingRows.some(item => item.route === route);
  const setting = await getUserRssSetting(normalizedUserId);
  const feedUrl = await resolveFeedUrl(
    {
      route,
    },
    normalizedUserId,
    setting.host
  );
  let name = normalizeSubscriptionName(String(payload?.name || ''));
  if (!name) {
    try {
      const previewFeed = await fetchRssFeedFromUpstream({
        feedUrl,
        setting,
      });
      const parsed = parseRssFeedItemsFromXml(previewFeed.xml);
      const previewTitle = normalizeSubscriptionName(String(parsed.title || ''));
      name = previewTitle;
    } catch (error) {
      log.warn('[rss-subscription] 自动读取订阅标题失败', {
        userId: normalizedUserId,
        route,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
  await upsertUserRssSubscriptionState({
    userId: normalizedUserId,
    route,
    name: name || route,
    feedUrl,
  });
  const rows = await listUserRssSubscriptionStates(normalizedUserId);
  const current = rows.find(item => item.route === route);
  if (!current) {
    const message = t('rssApi.subscriptionCreateFailed');
    badRequest(message);
    throw new Error(message);
  }
  if (!existed) {
    void fetchRssFeed(
      {
        route,
        force: true,
      },
      normalizedUserId
    ).catch(error => {
      log.warn('[rss-subscription] 新订阅首次拉取失败', {
        userId: normalizedUserId,
        route,
        error: error instanceof Error ? error.message : String(error),
      });
    });
  }
  emitRssStorageChanged(normalizedUserId, { source: 'action' });
  return mapSubscriptionItem(current);
}
export async function removeUserRssSubscription(userId: string | number | undefined, routeValue: string) {
  const normalizedUserId = getCurrentUserId(userId);
  const route = normalizeSubscriptionRoute(routeValue);
  await clearRssSubscriptionStorage(normalizedUserId, route);
  await removeUserRssSubscriptionState(normalizedUserId, route);
  emitRssStorageChanged(normalizedUserId, { source: 'action' });
  return { route };
}
export async function setUserRssSubscriptionEnabled(
  userId: string | number | undefined,
  payload: UpdateUserRssSubscriptionEnabledPayload
): Promise<UserRssSubscriptionItem> {
  const normalizedUserId = getCurrentUserId(userId);
  const route = normalizeSubscriptionRoute(payload?.route || '');
  const enabled = payload?.enabled !== false;
  const updated = await updateUserRssSubscriptionEnabled(normalizedUserId, route, enabled);
  if (!updated) {
    badRequest(t('rssApi.subscriptionNotFound'));
  }
  const rows = await listUserRssSubscriptionStates(normalizedUserId);
  const current = rows.find(item => item.route === route);
  if (!current) {
    badRequest(t('rssApi.subscriptionNotFound'));
  }
  emitRssStorageChanged(normalizedUserId, { source: 'action' });
  return mapSubscriptionItem(current!);
}
const resolveFeedUrl = async (
  params: GetRssFeedParams,
  userId?: string | number,
  fallbackHub?: string
): Promise<string> => {
  const feedUrl = String(params.feedUrl || '').trim();
  if (feedUrl) {
    return normalizeAbsoluteUrl(feedUrl, 'feedUrl');
  }
  const route = normalizeSubscriptionRoute(String(params.route || ''));
  if (isAbsoluteHttpUrl(route)) {
    return route;
  }
  let hub = String(params.hub || '').trim();
  if (!hub) {
    if (fallbackHub) {
      hub = fallbackHub;
    } else if (userId !== undefined && userId !== null) {
      const setting = await getUserRssSetting(userId);
      hub = setting.host;
    } else {
      hub = DEFAULT_RSS_HUB;
    }
  }
  const normalizedHubUrl = new URL(normalizeAbsoluteUrl(hub, 'hub'));
  normalizedHubUrl.pathname = '/';
  normalizedHubUrl.search = '';
  normalizedHubUrl.hash = '';
  return new URL(route, normalizedHubUrl).toString();
};
const fetchRssFeedFromUpstream = async (params: {
  feedUrl: string;
  setting: UserRssSettingPayload;
}): Promise<RssFeedPayload> => {
  const response: AxiosResponse<string> = await request
    .get<string>(params.feedUrl, {
      responseType: 'text',
      timeout: 20000,
      headers: {
        Accept: 'application/rss+xml, application/atom+xml, application/xml, text/xml;q=0.9, */*;q=0.1',
        'User-Agent': 'Volix-RSS-Reader/1.0 (+https://github.com/DIYgod/RSSHub)',
      },
    })
    .catch((error: AxiosError<{ message?: string } | string>) => {
      const status = error.response?.status;
      const upstreamText =
        typeof error.response?.data === 'string'
          ? error.response?.data
          : error.response?.data?.message || error.message;
      if (status === 403) {
        badRequest(t('rssApi.upstreamForbidden', { upstreamText }));
      }
      badRequest(t('rssApi.fetchFailed', { status: status || 'network', upstreamText }));
      throw error;
    });
  const xml = String(response.data || '').trim();
  if (!xml) {
    badRequest(t('rssApi.emptyData'));
  }
  const contentType = String(response.headers['content-type'] || 'application/xml');
  const fetchedAt = new Date().toISOString();
  return {
    feedUrl: params.feedUrl,
    contentType,
    xml,
    fetchedAt,
  };
};
const fetchAndCacheRssFeed = async (params: {
  userId: string;
  route: string;
  routeName: string;
  feedUrl: string;
  setting: UserRssSettingPayload;
}): Promise<RssFeedPayload> => {
  const payload = await fetchRssFeedFromUpstream(params);
  await enqueueRssFeedProcessingTask({
    userId: params.userId,
    route: params.route,
    routeName: params.routeName,
    payload,
    setting: {
      resourceProxyBaseUrl: params.setting.resourceProxyBaseUrl,
      resourceDownloadMaxRetry: params.setting.resourceDownloadMaxRetry,
    },
  });
  void startRssPendingQueue();
  const processed = await getProcessedRssFeedPayload({
    userId: params.userId,
    route: params.route,
  });
  if (processed) {
    return processed;
  }
  return getRssPendingFeedPlaceholder(payload.feedUrl);
};
const refreshRssFeedInBackground = (params: {
  userId: string;
  route: string;
  routeName: string;
  feedUrl: string;
  setting: UserRssSettingPayload;
}) => {
  const normalizedFeedUrl = String(params.feedUrl || '').trim();
  if (!normalizedFeedUrl) {
    return;
  }
  const current = rssFeedRefreshJobMap.get(normalizedFeedUrl);
  if (current) {
    return;
  }
  const job = (async () => {
    try {
      const autoRefreshEnabled = await isUserRssSubscriptionEnabled(params.userId, params.route);
      if (!autoRefreshEnabled) {
        return;
      }
      const pending = await hasPendingRssFeedTask({
        userId: params.userId,
        route: params.route,
        feedUrl: normalizedFeedUrl,
      });
      if (pending) {
        void startRssPendingQueue();
        return;
      }
      await fetchAndCacheRssFeed({
        userId: params.userId,
        route: params.route,
        routeName: params.routeName,
        feedUrl: normalizedFeedUrl,
        setting: params.setting,
      });
    } catch (error) {
      log.warn('[rss-cache] 后台刷新失败', {
        feedUrl: normalizedFeedUrl,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  })().finally(() => {
    rssFeedRefreshJobMap.delete(normalizedFeedUrl);
  });
  rssFeedRefreshJobMap.set(normalizedFeedUrl, job);
};
const buildDefaultRssSetting = (): UserRssSettingPayload => ({
  host: DEFAULT_RSS_HUB,
  resourceProxyBaseUrl: DEFAULT_RESOURCE_PROXY_BASE_URL,
  resourceCacheMaxSizeMb: DEFAULT_RESOURCE_CACHE_SIZE_MB,
  refreshIntervalMinutes: DEFAULT_REFRESH_INTERVAL_MINUTES,
  resourceDownloadMaxRetry: DEFAULT_RESOURCE_DOWNLOAD_MAX_RETRY,
});
export async function fetchRssFeed(params: GetRssFeedParams, userId?: string | number): Promise<RssFeedPayload> {
  if (userId === undefined || userId === null) {
    return fetchRssFeedFromUpstream({
      feedUrl: await resolveFeedUrl(params, userId),
      setting: buildDefaultRssSetting(),
    });
  }
  const normalizedUserId = getCurrentUserId(userId);
  const normalizedRoute = normalizeSubscriptionRoute(String(params.route || ''));
  const forceRefresh = parseForceRefreshFlag(params.force);
  const currentSetting = await getUserRssSetting(normalizedUserId);
  const feedUrl = await resolveFeedUrl(params, normalizedUserId, currentSetting.host);
  const staleMs = normalizeRefreshIntervalMinutes(currentSetting.refreshIntervalMinutes) * 60 * 1000;
  const pending = await hasPendingRssFeedTask({ userId: normalizedUserId, route: normalizedRoute, feedUrl });
  const autoRefreshEnabled = await isUserRssSubscriptionEnabled(normalizedUserId, normalizedRoute);
  if (forceRefresh) {
    if (pending) {
      void startRssPendingQueue();
      const processed = await getProcessedRssFeedPayload({ userId: normalizedUserId, route: normalizedRoute });
      return processed || getRssPendingFeedPlaceholder(feedUrl);
    }
    return fetchAndCacheRssFeed({
      userId: normalizedUserId,
      route: normalizedRoute,
      routeName: normalizedRoute,
      feedUrl,
      setting: currentSetting,
    });
  }
  const processedPayload = await getProcessedRssFeedPayload({ userId: normalizedUserId, route: normalizedRoute });
  if (processedPayload) {
    const fetchedAtMs = Date.parse(String(processedPayload.fetchedAt || ''));
    const processedAgeMs = Number.isNaN(fetchedAtMs) ? Number.POSITIVE_INFINITY : Math.max(0, Date.now() - fetchedAtMs);
    if (autoRefreshEnabled && processedAgeMs > staleMs) {
      if (pending) {
        void startRssPendingQueue();
      } else {
        refreshRssFeedInBackground({
          userId: normalizedUserId,
          route: normalizedRoute,
          routeName: normalizedRoute,
          feedUrl,
          setting: currentSetting,
        });
      }
    }
    return processedPayload;
  }
  if (pending) {
    void startRssPendingQueue();
    return getRssPendingFeedPlaceholder(feedUrl);
  }
  if (!autoRefreshEnabled) {
    return (
      processedPayload || {
        feedUrl,
        contentType: 'application/rss+xml',
        fetchedAt: new Date(0).toISOString(),
        xml: '<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel></channel></rss>',
        items: [],
      }
    );
  }
  return fetchAndCacheRssFeed({
    userId: normalizedUserId,
    route: normalizedRoute,
    routeName: normalizedRoute,
    feedUrl,
    setting: currentSetting,
  });
}
export async function getRssStorageData(userId: string | number | undefined): Promise<RssStorageStatusPayload> {
  return getRssStorageStatus(getCurrentUserId(userId));
}
export async function clearRssStorageData(
  userId: string | number | undefined,
  payload?: ClearRssStoragePayload
): Promise<RssStorageStatusPayload> {
  const normalizedUserId = getCurrentUserId(userId);
  const status = await clearRssStorage(normalizedUserId, payload);
  emitRssStorageChanged(normalizedUserId, { source: 'action' });
  return status;
}
