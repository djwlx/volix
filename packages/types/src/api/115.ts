export interface QrCodeStatusParams {
  uid: string;
  sign: string;
  time: number;
}

export interface Account115UserInfo {
  user_name: string;
  face: string;
}

export interface QrLoginParams {
  uid: string;
  app: string;
}

export interface FileListParams {
  offset?: number;
  pageSize?: number;
  cid?: string;
}

export interface FileListDataItem {
  n: string;
  pc: string;
  cid: string;
  fid?: string;
}
export interface FileListData {
  data: FileListDataItem[];
  count: number;
  path: { name: string }[];
}

export interface PicInfoParams {
  paths: string[];
}

export interface ClearPicInfoParams {
  paths?: string[];
  folderPaths?: string[];
}

export interface RetryPicInfoParams {
  paths: string[];
}

export interface Like115PicParams {
  cid?: string;
  pc?: string;
  liked?: boolean;
}

export interface Like115PicResponse {
  pc: string;
  cid: string;
  liked: boolean;
  path: string;
  parentPath: string;
  cached: boolean;
  url: string;
}

export interface Random115PicResponse {
  url: string;
  fileName: string;
  cid: string;
  pc: string;
  path: string;
  parentPath: string;
  liked: boolean;
  notice?: string;
  remoteSource?: boolean;
  autoPlayIntervalSeconds?: number;
}

export interface PicPathByPcResponse {
  pc: string;
  cid: string;
  parentPath: string;
  path: string;
  liked: boolean;
  cached: boolean;
}

export interface Liked115PicItem {
  pc: string;
  cid: string;
  path: string;
  parentPath: string;
  fileName: string;
  liked: boolean;
  cached: boolean;
  url: string;
}

export interface Liked115PicListResponse {
  count: number;
  data: Liked115PicItem[];
  offset: number;
  pageSize: number;
}

export type PicCacheFolderStatus = 'pending' | 'caching' | 'cached' | 'failed' | 'partial';

export interface PicCacheFolderItem {
  cid: string;
  status: PicCacheFolderStatus;
  errorMessage?: string;
  updatedAt?: string;
  count?: number;
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
  cloudProxyUrl: string;
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

// 完整的类型定义
export interface QrCodeResponse {
  qrCode: string;
  qrCodeValue: QrCodeValue;
  qrCodeImg: string;
}

export interface QrCodeValue {
  uid: string;
  time: number;
  sign: string;
  qrcode: string;
}

export interface QrCodeStatus {
  msg: string;
  status: number;
  version: string;
}

export interface PicInfo115 {
  loading: boolean;
  count: number;
  likedCount: number;
  folders: PicCacheFolderItem[];
  cachedCids: string[];
  cachedFolderPaths: string[];
  randomCacheConfig: PicRandomCacheConfig;
  randomCacheStats: PicRandomCacheStats;
}

export interface SetPicRandomCacheConfigParams {
  sourceWeights?: {
    memory?: number;
    local?: number;
    cloud?: number;
  };
  memoryMaxSizeMb?: number;
  localMaxSizeMb?: number;
  randomNoRepeatWindowMinutes?: number;
  randomNoRepeatMaxCount?: number;
  cloudProxyUrl?: string;
  autoPlayIntervalSeconds?: number;
}
