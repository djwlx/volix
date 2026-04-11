import { http } from '@/utils';
import type {
  Account115UserInfo,
  ClearPicInfoParams,
  FileListData,
  FileListParams,
  Like115PicParams,
  PicInfo115,
  PicInfoParams,
  QrCodeResponse,
  QrCodeStatus,
  QrCodeStatusParams,
  QrLoginParams,
  Random115PicResponse,
  RetryPicInfoParams,
} from '@volix/types';

export function get115QrCode() {
  return http.get<QrCodeResponse>('/115/qrcode');
}

export function get115QrCodeStatus(params: QrCodeStatusParams) {
  return http.get<QrCodeStatus>('/115/qrcode/status', { params });
}

export function login115(data: QrLoginParams) {
  return http.post('/115/qrcode/login', data);
}

export function exit115() {
  return http.post('/115/exit');
}

export function get115UserInfo() {
  return http.get<Account115UserInfo>('/115/user');
}

export function get115FileList(params?: FileListParams) {
  const { cid, ...rest } = params || {};
  const path = cid ? `/${cid}` : '/0';
  return http.get<FileListData>(`/115/files${path}`, { params: rest });
}
export function get115FileInfo(pc: string) {
  const path = pc ? `/${pc}` : '';
  return http.get(`/115/file${path}`);
}
export function get115PicInfo() {
  return http.get<PicInfo115>('/115/pic/info');
}

export function set115PicInfo(data: PicInfoParams) {
  return http.put('/115/pic/info', data);
}
export function clear115Pic(data?: ClearPicInfoParams) {
  return http.delete('/115/pic/info', {
    data,
  });
}

export function retry115Pic(data: RetryPicInfoParams) {
  return http.post('/115/pic/info/retry', data);
}

export function like115Pic(data: Like115PicParams) {
  return http.post('/115/pic/like', data);
}

export function get115Pic(mode: 'json' | 'direct' = 'json') {
  const url = mode === 'json' ? '/115/pic?mode=json' : '/115/pic?mode=direct';
  return http.get<Random115PicResponse>(url, { responseType: mode === 'json' ? 'json' : 'blob' });
}
