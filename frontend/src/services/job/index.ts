import { http } from '@/utils';

export function startQbit() {
  return http.get('/util/qbit-start');
}
export function pauseQbit() {
  return http.get('/util/qbit-pause');
}
