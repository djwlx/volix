import { http } from '@/utils';

export function get115QrCode() {
  return http.get('/util/115-qrcode');
}

export function get115QrCodeStatus(params: { uid: string; sign: string; time: number }) {
  return http.get('/util/115-qrcode-status', { params });
}

export function Login115(data: { uid: string; app: string }) {
  return http.post('/util/115-login', data);
}

export function exit115() {
  return http.post('/util/115-exit');
}

export function get115UserInfo() {
  return http.get('/util/115-user-info');
}

export function get115LoginStatus() {
  return http.get('/util/115-login-status');
}

export function get115FileList(params?: { offset?: number; pageSize?: number; cid?: string }) {
  return http.get('/util/115-files', { params });
}
export function get115FileInfo(pc: string) {
  return http.get('/util/115-file-info', {
    params: {
      pc,
    },
  });
}
export function get115PicInfo() {
  return http.get('/util/115-pictures');
}

export function set115PicInfo(data: { type: string; paths: string[] }) {
  return http.post('/util/115-pictures', data);
}
