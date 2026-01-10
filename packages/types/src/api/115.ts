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
}

export interface PicInfoParams {
  type: string;
  paths: string[];
}
