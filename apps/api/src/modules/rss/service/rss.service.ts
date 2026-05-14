import request from '../../../utils/request';
import { log } from '../../../utils/logger';
import { badRequest, unauthorized } from '../../shared/http-handler';
import {
  getCachedResourceByKey,
  parseResourceCacheSizeMb,
  parseResourceProxyBaseUrl,
} from '../../shared/service/resource-proxy-cache.service';
import { getRssFeedCacheAgeMs, readCachedRssFeed, writeCachedRssFeed } from './rss-feed-cache.service';
import { appendRssFeedArchiveSnapshot } from './rss-feed-archive.service';
import { UserRssSettingModel } from '../model/rss-setting.model';
import { UserRssSubscriptionModel } from '../model/rss-subscription.model';
import { rewriteRssXmlResourceUrls } from './rss-resource-proxy.service';
import type {
  CreateUserRssSubscriptionPayload,
  GetRssFeedParams,
  RssFeedPayload,
  UpdateUserRssSettingPayload,
  UserRssSettingPayload,
  UserRssSubscriptionItem,
} from '../types/rss.types';
import type { AxiosError, AxiosResponse } from 'axios';

const DEFAULT_RSS_HUB = 'https://rsshub.app';
const DEFAULT_RESOURCE_PROXY_BASE_URL = '';
const DEFAULT_RESOURCE_CACHE_SIZE_MB = 512;
const RSS_FEED_CACHE_STALE_MS = 5 * 60 * 1000;
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

const parseForceRefreshFlag = (value: unknown): boolean => {
  if (typeof value === 'boolean') {
    return value;
  }
  const text = String(value || '')
    .trim()
    .toLowerCase();
  return text === '1' || text === 'true' || text === 'yes';
};

const decodeHtmlEntities = (value: string): string => {
  const entityMap: Record<string, string> = {
    amp: '&',
    lt: '<',
    gt: '>',
    quot: '"',
    apos: "'",
  };

  return value.replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (_, raw: string) => {
    const key = String(raw || '').toLowerCase();
    if (key.startsWith('#x')) {
      const code = Number.parseInt(key.slice(2), 16);
      return Number.isFinite(code) ? String.fromCodePoint(code) : _;
    }
    if (key.startsWith('#')) {
      const code = Number.parseInt(key.slice(1), 10);
      return Number.isFinite(code) ? String.fromCodePoint(code) : _;
    }
    return entityMap[key] || _;
  });
};

const extractFeedTitleFromXml = (xml: string): string => {
  const normalizedXml = String(xml || '');
  if (!normalizedXml) {
    return '';
  }

  const rssMatched = normalizedXml.match(/<channel[\s\S]*?<title[^>]*>([\s\S]*?)<\/title>/i);
  const atomMatched = normalizedXml.match(/<feed[\s\S]*?<title[^>]*>([\s\S]*?)<\/title>/i);
  const rawTitle = String(rssMatched?.[1] || atomMatched?.[1] || '');
  if (!rawTitle) {
    return '';
  }

  const unwrappedCdata = rawTitle.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/gi, '$1');
  const titleText = decodeHtmlEntities(unwrappedCdata.replace(/<[^>]+>/g, '').trim());
  return String(titleText || '').trim();
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

const mapSubscriptionItem = (row: { dataValues: Record<string, any> }): UserRssSubscriptionItem => {
  const route = String(row.dataValues.route || '');
  const name = normalizeSubscriptionName(String(row.dataValues.name || ''));
  return {
    id: Number(row.dataValues.id || 0),
    route,
    name: name || route,
    createdAt: row.dataValues.created_at,
    updatedAt: row.dataValues.updated_at,
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
    });
    await current.save();
    return { host, resourceProxyBaseUrl, resourceCacheMaxSizeMb };
  }

  await UserRssSettingModel.create({
    user_id: normalizedUserId,
    host,
    resource_proxy_base_url: resourceProxyBaseUrl,
    resource_cache_max_size_mb: resourceCacheMaxSizeMb,
  });

  return { host, resourceProxyBaseUrl, resourceCacheMaxSizeMb };
}

export async function listUserRssSubscriptions(
  userId: string | number | undefined
): Promise<UserRssSubscriptionItem[]> {
  const normalizedUserId = getCurrentUserId(userId);

  const rows = await UserRssSubscriptionModel.findAll({
    where: {
      user_id: normalizedUserId,
    },
    order: [
      ['updated_at', 'DESC'],
      ['id', 'DESC'],
    ],
  });

  return rows.map(row => mapSubscriptionItem(row));
}

export async function createUserRssSubscription(
  userId: string | number | undefined,
  payload: CreateUserRssSubscriptionPayload
): Promise<UserRssSubscriptionItem> {
  const normalizedUserId = getCurrentUserId(userId);
  const route = normalizeRoute(payload?.route || '');
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
      name = normalizeSubscriptionName(extractFeedTitleFromXml(previewFeed.xml));
    } catch (error) {
      log.warn('[rss-subscription] 自动读取订阅标题失败', {
        userId: normalizedUserId,
        route,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  const existing = await UserRssSubscriptionModel.findOne({
    where: {
      user_id: normalizedUserId,
      route,
    },
  });

  if (existing) {
    const existingName = normalizeSubscriptionName(String(existing.dataValues.name || ''));
    if (!existingName && name) {
      await existing.update({ name });
      await existing.save();
    }
    return mapSubscriptionItem(existing);
  }

  const created = await UserRssSubscriptionModel.create({
    user_id: normalizedUserId,
    route,
    name: name || route,
  });

  return mapSubscriptionItem(created);
}

export async function removeUserRssSubscription(userId: string | number | undefined, routeValue: string) {
  const normalizedUserId = getCurrentUserId(userId);
  const route = normalizeRoute(routeValue);

  await UserRssSubscriptionModel.destroy({
    where: {
      user_id: normalizedUserId,
      route,
    },
  });

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

  const rewrittenXml = await rewriteRssXmlResourceUrls({
    xml,
    requestProxyUrl: params.setting.resourceProxyBaseUrl,
    cacheSizeMb: params.setting.resourceCacheMaxSizeMb,
  });

  const contentType = String(response.headers['content-type'] || 'application/xml');
  const fetchedAt = new Date().toISOString();
  return {
    feedUrl: params.feedUrl,
    contentType,
    xml: rewrittenXml,
    fetchedAt,
  };
};

const fetchAndCacheRssFeed = async (params: {
  feedUrl: string;
  setting: UserRssSettingPayload;
}): Promise<RssFeedPayload> => {
  const payload = await fetchRssFeedFromUpstream(params);
  await writeCachedRssFeed(payload);
  await appendRssFeedArchiveSnapshot(payload);
  return payload;
};

const refreshRssFeedInBackground = (params: { feedUrl: string; setting: UserRssSettingPayload }) => {
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
      await fetchAndCacheRssFeed({
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
  };
};

export async function fetchRssFeed(params: GetRssFeedParams, userId?: string | number): Promise<RssFeedPayload> {
  const forceRefresh = parseForceRefreshFlag(params.force);
  const currentSetting =
    userId !== undefined && userId !== null ? await getUserRssSetting(userId) : buildDefaultRssSetting();
  const feedUrl = await resolveFeedUrl(params, userId, currentSetting.host);

  if (forceRefresh) {
    return fetchAndCacheRssFeed({
      feedUrl,
      setting: currentSetting,
    });
  }

  const cached = await readCachedRssFeed(feedUrl);
  if (cached) {
    const cacheAgeMs = getRssFeedCacheAgeMs(cached);
    const cachedPayload: RssFeedPayload = {
      feedUrl: cached.feedUrl,
      contentType: cached.contentType,
      xml: cached.xml,
      fetchedAt: cached.fetchedAt,
    };

    await appendRssFeedArchiveSnapshot(cachedPayload);

    if (cacheAgeMs <= RSS_FEED_CACHE_STALE_MS) {
      return cachedPayload;
    }

    refreshRssFeedInBackground({
      feedUrl,
      setting: currentSetting,
    });

    return cachedPayload;
  }

  return fetchAndCacheRssFeed({
    feedUrl,
    setting: currentSetting,
  });
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
