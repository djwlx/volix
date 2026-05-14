import { log } from '../../../utils/logger';
import { UserRssSubscriptionModel } from '../model/rss-subscription.model';
import { fetchRssFeed } from './rss.service';

const RSS_FEED_AUTO_REFRESH_INTERVAL_MS = 3 * 60 * 1000;
const RSS_FEED_AUTO_REFRESH_CONCURRENCY = 3;

let rssFeedAutoRefreshTimer: NodeJS.Timeout | null = null;

const runWithConcurrency = async <T>(list: T[], concurrency: number, worker: (item: T) => Promise<void>) => {
  let index = 0;
  const runner = async () => {
    while (true) {
      const current = index;
      index += 1;
      if (current >= list.length) {
        break;
      }
      await worker(list[current]);
    }
  };

  const size = Math.max(1, Math.min(concurrency, list.length || 1));
  await Promise.all(Array.from({ length: size }, () => runner()));
};

const refreshAllSubscribedFeeds = async () => {
  const rows = await UserRssSubscriptionModel.findAll({
    attributes: ['user_id', 'route'],
  });

  const tasks = new Map<string, { userId: string; route: string }>();
  rows.forEach(row => {
    const userId = String(row.dataValues.user_id || '').trim();
    const route = String(row.dataValues.route || '').trim();
    if (!userId || !route) {
      return;
    }

    const key = `${userId}::${route}`;
    if (!tasks.has(key)) {
      tasks.set(key, { userId, route });
    }
  });

  await runWithConcurrency(Array.from(tasks.values()), RSS_FEED_AUTO_REFRESH_CONCURRENCY, async task => {
    try {
      await fetchRssFeed(
        {
          route: task.route,
        },
        task.userId
      );
    } catch (error) {
      log.warn('[rss-cache] 自动预热失败', {
        userId: task.userId,
        route: task.route,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  });
};

export const startRssFeedAutoRefreshTask = () => {
  if (rssFeedAutoRefreshTimer) {
    return;
  }

  void refreshAllSubscribedFeeds();
  rssFeedAutoRefreshTimer = setInterval(() => {
    void refreshAllSubscribedFeeds();
  }, RSS_FEED_AUTO_REFRESH_INTERVAL_MS);
};
