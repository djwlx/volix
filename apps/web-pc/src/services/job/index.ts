import { http } from '@/utils';

export function startQbit() {
  return http.get('/util/qbit-start');
}
export function pauseQbit() {
  return http.get('/util/qbit-pause');
}
// 修改自动任务
export function changeJob(data: { qbit: boolean }) {
  return http.post('/util/job-change', data);
}
// 查询自动任务
export function getJob() {
  return http.get('/util/job-get');
}
