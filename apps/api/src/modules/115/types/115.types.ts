export type Cloud115AppType = 'web' | 'android' | 'ios' | 'tv';

export type RandomPicMode = 'direct' | 'json' | undefined;

export interface RandomPicMeta {
  url: string;
  fileName: string;
  cid: string;
  pc: string;
  path: string;
  parentPath: string;
  liked: boolean;
  localCacheFilePath?: string;
  localCacheMimeType?: string;
  notice?: string;
}

export interface Cloud115DbFileItem {
  pc: string;
  class: string;
  cid: string;
  parentCid: string;
  fullPath: string;
  isLiked: boolean;
  localCacheFileName: string;
}

export interface PicRandomCacheConfig {
  sourceWeights: {
    memory: number;
    local: number;
    cloud: number;
  };
  memoryMaxSizeMb: number;
  localMaxSizeMb: number;
  randomNoRepeatWindowMinutes: number;
  randomNoRepeatMaxCount: number;
  randomPicEndpoint: string;
  localProxyEnabled: boolean;
  autoPlayIntervalSeconds: number;
}

export interface PicRandomCacheStats {
  memoryFileCount: number;
  memoryTotalSizeBytes: number;
  memoryTotalSizeMb: number;
  memoryLimitExceeded: boolean;
  localFileCount: number;
  localTotalSizeBytes: number;
  localTotalSizeMb: number;
  localLimitExceeded: boolean;
}
