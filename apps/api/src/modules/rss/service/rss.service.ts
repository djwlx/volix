import request from '../../../utils/request';
import { log } from '../../../utils/logger';
import { badRequest, unauthorized } from '../../shared/http-handler';
import {
  getCachedResourceByKey,
  parseResourceCacheSizeMb,
  parseResourceProxyBaseUrl,
} from '../../shared/service/resource-proxy-cache.service';
import { UserRssSettingModel } from '../model/rss-setting.model';
import { parseRssFeedItemsFromXml } from './rss-feed-item-parser.service';
import {
  listUserRssSubscriptionStates,
  removeUserRssSubscriptionState,
  upsertUserRssSubscriptionState,
  type UserRssSubscriptionStateRow,
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
  UserRssSettingPayload,
  UserRssSubscriptionItem,
} from '../types/rss.types';
import type { AxiosError, AxiosResponse } from 'axios';
const DEFAULT_RSS_HUB = 'https://rsshub.app';
const DEFAULT_RESOURCE_PROXY_BASE_URL = '';
const DEFAULT_RESOURCE_CACHE_SIZE_MB = 0;
const DEFAULT_REFRESH_INTERVAL_MINUTES = 5;
const MIN_REFRESH_INTERVAL_MINUTES = 1;
const MAX_REFRESH_INTERVAL_MINUTES = 24 * 60;
const ALLOWED_PROTOCOLS = new Set(['http:', 'https:']);
const rssFeedRefreshJobMap = new Map<string, Promise<void>>();
const parseUrlOrThrow = (value: string, fieldName: string): URL => {
  try {
    return new URL(value);
  } catch {
    badRequest(`${fieldName} 不是合法 URL`);
    throw new Error(`${fieldName} 不是合法 URL`);
  }
};
const assertAllowedProtocol = (url: URL, fieldName: string) => {
  if (!ALLOWED_PROTOCOLS.has(url.protocol)) {
    badRequest(`${fieldName} 仅支持 http 或 https`);
  }
};
const normalizeRoute = (route: string): string => {
  const trimmedRoute = String(route || '').trim();
  if (!trimmedRoute) {
    badRequest('route 不能为空');
  }
  if (/^https?:\/\//i.test(trimmedRoute)) {
    badRequest('route 不能是完整 URL，请放在 feedUrl 参数中');
  }
  return trimmedRoute.startsWith('/') ? trimmedRoute : `/${trimmedRoute}`;
};
const normalizeHost = (host: string): string => {
  const trimmedHost = String(host || '').trim();
  if (!trimmedHost) {
    badRequest('host 不能为空');
  }
  const parsedHost = parseUrlOrThrow(trimmedHost, 'host');
  assertAllowedProtocol(parsedHost, 'host');
  const normalizedHost = new URL(parsedHost.toString());
  normalizedHost.pathname = '/';
  normalizedHost.search = '';
  normalizedHost.hash = '';
  return normalizedHost.toString();
};
const normalizeResourceProxyBaseUrl = (value: string): string => {
  const trimmed = String(value || '').trim();
  if (!trimmed) {
    return '';
  }
  const normalized = parseResourceProxyBaseUrl(trimmed);
  if (!normalized) {
    badRequest('resourceProxyBaseUrl 不是合法代理 URL，且仅支持 http 或 https');
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
const parseForceRefreshFlag = (value: unknown): boolean => {
  if (typeof value === 'boolean') {
    return value;
  }
  const text = String(value || '')
    .trim()
    .toLowerCase();
  return text === '1' || text === 'true' || text === 'yes';
};
const normalizeSubscriptionName = (name: string): string => {
  const normalized = String(name || '').trim();
  if (!normalized) {
    return '';
  }
  return normalized.slice(0, 255);
};
const getCurrentUserId = (rawUserId: string | number | undefined): string => {
  const userId = String(rawUserId || '').trim();
  if (!userId) {
    unauthorized('未登录');
  }
  return userId;
};
const mapSubscriptionItem = (row: UserRssSubscriptionStateRow): UserRssSubscriptionItem => {
  const route = String(row.route || '');
  const name = normalizeSubscriptionName(String(row.name || ''));
  return {
    id: Number(row.id || 0),
    route,
    name: name || route,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
};
export async function getUserRssSetting(userId: string | number | undefined): Promise<UserRssSettingPayload> {
  const normalizedUserId = getCurrentUserId(userId);
  const setting = await UserRssSettingModel.findOne({
    where: {
      user_id: normalizedUserId,
    },
  });
  return {
    host: setting?.dataValues.host || DEFAULT_RSS_HUB,
    resourceProxyBaseUrl: String(setting?.dataValues.resource_proxy_base_url || DEFAULT_RESOURCE_PROXY_BASE_URL),
    resourceCacheMaxSizeMb: normalizeResourceCacheSizeMb(Number(setting?.dataValues.resource_cache_max_size_mb || 0)),
    refreshIntervalMinutes: normalizeRefreshIntervalMinutes(Number(setting?.dataValues.refresh_interval_minutes || 0)),
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
  const current = await UserRssSettingModel.findOne({
    where: {
      user_id: normalizedUserId,
    },
  });
  if (current) {
    await current.update({
      host,
      resource_proxy_base_url: resourceProxyBaseUrl,
      resource_cache_max_size_mb: resourceCacheMaxSizeMb,
      refresh_interval_minutes: refreshIntervalMinutes,
    });
    await current.save();
    return { host, resourceProxyBaseUrl, resourceCacheMaxSizeMb, refreshIntervalMinutes };
  }
  await UserRssSettingModel.create({
    user_id: normalizedUserId,
    host,
    resource_proxy_base_url: resourceProxyBaseUrl,
    resource_cache_max_size_mb: resourceCacheMaxSizeMb,
    refresh_interval_minutes: refreshIntervalMinutes,
  });
  return { host, resourceProxyBaseUrl, resourceCacheMaxSizeMb, refreshIntervalMinutes };
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
  const route = normalizeRoute(payload?.route || '');
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
      const previewFeed = await fetchRssFeed(
        {
          route,
          force: false,
        },
        normalizedUserId
      );
      const parsed = parseRssFeedItemsFromXml(previewFeed.xml);
      const previewTitle = normalizeSubscriptionName(String(previewFeed.title || parsed.title || ''));
      name = previewTitle === 'RSS 正在处理' ? '' : previewTitle;
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
    badRequest('添加订阅失败');
    throw new Error('添加订阅失败');
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
  return mapSubscriptionItem(current);
}
export async function removeUserRssSubscription(userId: string | number | undefined, routeValue: string) {
  const normalizedUserId = getCurrentUserId(userId);
  const route = normalizeRoute(routeValue);
  await clearRssSubscriptionStorage(normalizedUserId, route);
  await removeUserRssSubscriptionState(normalizedUserId, route);
  return {
    route,
  };
}
const resolveFeedUrl = async (
  params: GetRssFeedParams,
  userId?: string | number,
  fallbackHub?: string
): Promise<string> => {
  const feedUrl = String(params.feedUrl || '').trim();
  if (feedUrl) {
    const parsedFeedUrl = parseUrlOrThrow(feedUrl, 'feedUrl');
    assertAllowedProtocol(parsedFeedUrl, 'feedUrl');
    return parsedFeedUrl.toString();
  }
  const route = normalizeRoute(String(params.route || ''));
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
  const hubUrl = parseUrlOrThrow(hub, 'hub');
  assertAllowedProtocol(hubUrl, 'hub');
  const normalizedHubUrl = new URL(hubUrl.toString());
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
        badRequest(
          `RSSHub 返回 403，当前 Host 可能限制了该请求。请在“设置 -> RSS 配置”切换为你自建的 RSSHub 实例。原始信息：${upstreamText}`
        );
      }
      badRequest(`拉取 RSS 失败（${status || 'network'}）：${upstreamText}`);
      throw error;
    });
  const xml = String(response.data || '').trim();
  if (!xml) {
    badRequest('RSS 数据为空');
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
const buildDefaultRssSetting = (): UserRssSettingPayload => {
  return {
    host: DEFAULT_RSS_HUB,
    resourceProxyBaseUrl: DEFAULT_RESOURCE_PROXY_BASE_URL,
    resourceCacheMaxSizeMb: DEFAULT_RESOURCE_CACHE_SIZE_MB,
    refreshIntervalMinutes: DEFAULT_REFRESH_INTERVAL_MINUTES,
  };
};
export async function fetchRssFeed(params: GetRssFeedParams, userId?: string | number): Promise<RssFeedPayload> {
  if (userId === undefined || userId === null) {
    return fetchRssFeedFromUpstream({
      feedUrl: await resolveFeedUrl(params, userId),
      setting: buildDefaultRssSetting(),
    });
  }

  const normalizedUserId = getCurrentUserId(userId);
  const normalizedRoute = normalizeRoute(String(params.route || ''));
  const forceRefresh = parseForceRefreshFlag(params.force);
  const currentSetting = await getUserRssSetting(normalizedUserId);
  const feedUrl = await resolveFeedUrl(params, normalizedUserId, currentSetting.host);
  const staleMs = normalizeRefreshIntervalMinutes(currentSetting.refreshIntervalMinutes) * 60 * 1000;
  const pending = await hasPendingRssFeedTask({ userId: normalizedUserId, route: normalizedRoute, feedUrl });
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
    if (processedAgeMs > staleMs) {
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
  return clearRssStorage(getCurrentUserId(userId), payload);
}
export async function getRssCachedResourceData(
  cacheKey: string
): Promise<NonNullable<Awaited<ReturnType<typeof getCachedResourceByKey>>>> {
  const normalizedCacheKey = String(cacheKey || '').trim();
  if (!normalizedCacheKey) {
    badRequest('缺少缓存资源标识');
  }
  const cached = await getCachedResourceByKey({
    scope: 'rss',
    cacheKey: normalizedCacheKey,
  });
  if (!cached) {
    badRequest('缓存资源不存在');
  }
  return cached!;
}
