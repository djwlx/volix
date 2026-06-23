export interface RssReaderFetchParams {
  route?: string;
  hub?: string;
  feedUrl?: string;
  force?: boolean;
}

export interface RssReaderItem {
  id: string;
  title: string;
  link: string;
  description: string;
  descriptionHtml: string;
  imageUrls: string[];
  author: string;
  publishedAt: string;
  guid?: string;
  category?: string[];
  updated?: string;
  enclosureUrl?: string;
  enclosureLength?: number;
  enclosureType?: string;
  comments?: number;
  upvotes?: number;
  downvotes?: number;
  media?: Record<string, unknown>;
  doi?: string;
  resourcesLocalized?: boolean;
}

export interface RssReaderRawFeed {
  feedUrl: string;
  contentType: string;
  xml: string;
  fetchedAt: string;
  title?: string;
  description?: string;
  link?: string;
  items?: RssReaderItem[];
}

export interface UserRssSetting {
  host: string;
  resourceProxyBaseUrl: string;
  resourceCacheMaxSizeMb: number;
  refreshIntervalMinutes: number;
  resourceDownloadMaxRetry: number;
}

export interface RssPathUsageStat {
  key: string;
  label: string;
  path: string;
  sizeBytes: number;
  fileCount: number;
}

export interface RssStorageStatus {
  queue: {
    pendingCount: number;
    running: boolean;
  };
  routes: Array<{
    route: string;
    name: string;
    pendingCount: number;
    itemCount: number;
    lastUpdatedAt: string;
    lastNewCount: number;
    nextUpdateAt: string;
    storageSizeBytes: number;
    storageFileCount: number;
  }>;
  paths: RssPathUsageStat[];
  totalSizeBytes: number;
}

export interface UpdateUserRssSettingPayload {
  host: string;
  resourceProxyBaseUrl?: string;
  resourceCacheMaxSizeMb?: number;
  refreshIntervalMinutes?: number;
  resourceDownloadMaxRetry?: number;
}

export interface ClearRssStoragePayload {
  scope?: 'resource-cache' | 'history' | 'all';
  route?: string;
  routes?: string[];
  keepLatestItems?: number;
}

export interface UserRssSubscriptionItem {
  id: number;
  route: string;
  name?: string;
  enabled: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateUserRssSubscriptionPayload {
  route: string;
  name?: string;
}

export interface UpdateUserRssSubscriptionEnabledPayload {
  route: string;
  enabled: boolean;
}
