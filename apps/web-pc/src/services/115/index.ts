import { http } from '@/utils';

export function get115QrCode() {
  return http.get('/115/qrcode');
}

export function get115QrCodeStatus(params: { uid: string; sign: string; time: number }) {
  return http.get('/115/qrcode/status', { params });
}

export function Login115(data: { uid: string; app: string }) {
  return http.post('/115/qrcode/login', data);
}

export function exit115() {
  return http.post('/115/exit');
}

export function get115UserInfo() {
  return http.get('/115/user');
}

export function get115FileList(params?: { offset?: number; pageSize?: number; cid?: string }) {
  const { cid, ...rest } = params || {};
  const path = cid ? `/${cid}` : '';
  return http.get(`/115/files${path}`, { params: rest });
}
export function get115FileInfo(pc: string) {
  const path = pc ? `/${pc}` : '';
  return http.get(`/115/file${path}`);
}
export function get115PicInfo() {
  return http.get('/115/pic/info');
}

export function set115PicInfo(data: { type: string; paths: string[] }) {
  return http.put('/115/pic/info', data);
}
export function clear115Pic() {
  return http.delete('/115/pic/info');
}
