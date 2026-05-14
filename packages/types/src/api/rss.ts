export interface RssReaderFetchParams {
  route?: string;
  hub?: string;
  feedUrl?: string;
  force?: boolean;
}

export interface RssReaderHistoryFetchParams extends RssReaderFetchParams {
  cursor?: string;
}

export interface RssReaderRawFeed {
  feedUrl: string;
  contentType: string;
  xml: string;
  fetchedAt: string;
}

export type RssReaderHistorySource = 'latest' | 'upstream' | 'archive';
export type RssReaderHistoryMode = 'upstream' | 'archive' | 'none';

export interface RssReaderHistoryPayload {
  feedUrl: string;
  source: RssReaderHistorySource;
  mode: RssReaderHistoryMode;
  supportsUpstreamPagination: boolean;
  hasMore: boolean;
  nextCursor: string;
  page: RssReaderRawFeed;
}

export interface UserRssSetting {
  host: string;
  resourceProxyBaseUrl: string;
  resourceCacheMaxSizeMb: number;
}

export interface UpdateUserRssSettingPayload {
  host: string;
  resourceProxyBaseUrl?: string;
  resourceCacheMaxSizeMb?: number;
}

export interface UserRssSubscriptionItem {
  id: number;
  route: string;
  name?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateUserRssSubscriptionPayload {
  route: string;
  name?: string;
}
