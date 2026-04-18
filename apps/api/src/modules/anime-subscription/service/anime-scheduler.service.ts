import { log } from '../../../utils/logger';
import { initializeScheduledTaskPlatform } from '../../scheduled-task/service/scheduled-task-scheduler.service';

let started = false;

export const startAnimeSubscriptionSchedulers = () => {
  if (started) {
    return;
  }
  started = true;
  void initializeScheduledTaskPlatform().catch(error => {
    log.error('定时任务平台初始化失败', error);
  });
};
