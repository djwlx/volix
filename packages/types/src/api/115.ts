export interface QrCodeStatusParams {
  uid: string;
  sign: string;
  time: number;
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

export interface PicInfoParams {
  type: string;
  paths: string[];
}

export interface test {
  v: string;
}
