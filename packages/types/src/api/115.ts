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
}

export interface RetryPicInfoParams {
  paths: string[];
}

export interface Like115PicParams {
  cid?: string;
  pc?: string;
}

export interface Random115PicResponse {
  url: string;
  fileName: string;
  cid: string;
  pc: string;
}

export type PicCacheFolderStatus = 'pending' | 'caching' | 'cached' | 'failed';

export interface PicCacheFolderItem {
  cid: string;
  status: PicCacheFolderStatus;
  errorMessage?: string;
  updatedAt?: string;
  count?: number;
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
  folders: PicCacheFolderItem[];
}
