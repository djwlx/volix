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
