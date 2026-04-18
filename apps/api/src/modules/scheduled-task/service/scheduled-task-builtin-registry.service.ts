import { AnimeSubscriptionStatus } from '@volix/types';
import {
  queryAnimeSubscriptions,
  syncAllAnimeSubscriptionDownloads,
  triggerAnimeSubscriptionCheckInBackground,
} from '../../anime-subscription/service/anime-subscription.service';
import { badRequest } from '../../shared/http-handler';

export interface ScheduledTaskBuiltinExecutionResult {
  summary?: string | null;
  payload?: unknown;
}

type ScheduledTaskBuiltinHandler = () => Promise<ScheduledTaskBuiltinExecutionResult>;

const handlers: Record<string, ScheduledTaskBuiltinHandler> = {
  'anime.subscription.scan': async () => {
    const subscriptions = await queryAnimeSubscriptions();
    for (const row of subscriptions) {
      const subscription = row.dataValues;
      if (!subscription.enabled || subscription.status === AnimeSubscriptionStatus.PAUSED) {
        continue;
      }
      await triggerAnimeSubscriptionCheckInBackground(String(subscription.id));
    }
    return {
      summary: `processed:${subscriptions.length}`,
    };
  },
  'anime.download.sync': async () => {
    await syncAllAnimeSubscriptionDownloads();
    return {
      summary: 'download_sync_finished',
    };
  },
};

export const listScheduledTaskBuiltinHandlers = () => Object.keys(handlers);

export const executeBuiltinScheduledTask = async (handlerName: string) => {
  const handler = handlers[handlerName];
  if (!handler) {
    badRequest(`未知内置任务: ${handlerName}`);
  }
  return handler();
};
