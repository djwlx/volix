export interface GetRssFeedParams {
  route?: string;
  hub?: string;
  feedUrl?: string;
  force?: string | boolean;
}

export interface GetRssFeedHistoryParams extends GetRssFeedParams {
  cursor?: string;
}

export interface RssFeedPayload {
  feedUrl: string;
  contentType: string;
  xml: string;
  fetchedAt: string;
}

export type RssHistorySource = 'latest' | 'upstream' | 'archive';
export type RssHistoryMode = 'upstream' | 'archive' | 'none';

export interface RssFeedHistoryPayload {
  feedUrl: string;
  source: RssHistorySource;
  mode: RssHistoryMode;
  supportsUpstreamPagination: boolean;
  hasMore: boolean;
  nextCursor: string;
  page: RssFeedPayload;
}

export interface UpdateUserRssSettingPayload {
  host: string;
  resourceProxyBaseUrl?: string;
  resourceCacheMaxSizeMb?: number;
}

export interface UserRssSettingPayload {
  host: string;
  resourceProxyBaseUrl: string;
  resourceCacheMaxSizeMb: number;
}

export interface CreateUserRssSubscriptionPayload {
  route: string;
  name?: string;
}

export interface UserRssSubscriptionItem {
  id: number;
  route: string;
  name?: string;
  createdAt?: string;
  updatedAt?: string;
}
