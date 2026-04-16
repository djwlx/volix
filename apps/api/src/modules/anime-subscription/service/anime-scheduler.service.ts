import schedule from 'node-schedule';
import { AnimeSubscriptionStatus } from '@volix/types';
import { log } from '../../../utils/logger';
import {
  syncAllAnimeSubscriptionDownloads,
  triggerAnimeSubscriptionCheckInBackground,
} from './anime-subscription.service';
import { queryAnimeSubscriptions } from './anime-subscription.service';

let started = false;

export const startAnimeSubscriptionSchedulers = () => {
  if (started) {
    return;
  }
  started = true;

  void syncAllAnimeSubscriptionDownloads().catch(error => {
    log.error('自动追番下载同步任务启动时执行失败', error);
  });

  // Run RSS巡检 twice a day to avoid frequent AI calls and token waste.
  schedule.scheduleJob('0 9,21 * * *', async () => {
    try {
      const subscriptions = await queryAnimeSubscriptions();
      for (const record of subscriptions) {
        const subscription = record.dataValues;
        if (!subscription.enabled || subscription.status === AnimeSubscriptionStatus.PAUSED) {
          continue;
        }
        await triggerAnimeSubscriptionCheckInBackground(subscription.id as string | number);
      }
    } catch (error) {
      log.error('自动追番巡检任务执行失败', error);
    }
  });

  schedule.scheduleJob('*/5 * * * *', async () => {
    try {
      await syncAllAnimeSubscriptionDownloads();
    } catch (error) {
      log.error('自动追番下载同步任务执行失败', error);
    }
  });
};
