import { http } from '@/utils';
import type {
  Account115UserInfo,
  FileListData,
  FileListParams,
  PicInfo115,
  PicInfoParams,
  QrCodeResponse,
  QrCodeStatus,
  QrCodeStatusParams,
  QrLoginParams,
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
export function clear115Pic() {
  return http.delete('/115/pic/info');
}
