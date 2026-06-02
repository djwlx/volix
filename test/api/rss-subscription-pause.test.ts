import fs from 'fs';
import os from 'os';
import path from 'path';
import { afterEach, describe, expect, test } from 'vitest';
import sequelize from '../../apps/api/src/utils/sequelize';
import {
  listAllRssSubscriptionStates,
  listUserRssSubscriptionStates,
  upsertUserRssSubscriptionState,
} from '../../apps/api/src/modules/rss/service/rss-feed-db.service';
import { prunePendingTasksBySubscriptions } from '../../apps/api/src/modules/rss/service/rss-storage-queue-guard.service';

const makeUserId = () => `rss-pause-user-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
const makeRoute = () => `/rss-pause/${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

const cleanupSubscription = async (userId: string, route: string) => {
  await sequelize.query('DELETE FROM "volix_user_rss_feed_subscribe" WHERE "user_id" = :userId AND "route" = :route', {
    replacements: { userId, route },
  });
};

describe('rss subscription pause state', () => {
  const createdSubscriptions: Array<{ userId: string; route: string }> = [];
  const tempDirs: string[] = [];

  afterEach(async () => {
    await Promise.all(createdSubscriptions.splice(0).map(item => cleanupSubscription(item.userId, item.route)));
    await Promise.all(tempDirs.splice(0).map(dirPath => fs.promises.rm(dirPath, { recursive: true, force: true })));
  });

  test('keeps paused subscriptions in user list but excludes them from auto-refresh tasks', async () => {
    const userId = makeUserId();
    const route = makeRoute();
    createdSubscriptions.push({ userId, route });

    await upsertUserRssSubscriptionState({
      userId,
      route,
      name: route,
      feedUrl: `https://example.com${route}`,
    });

    await sequelize.query(
      'UPDATE "volix_user_rss_feed_subscribe" SET "enabled" = 0 WHERE "user_id" = :userId AND "route" = :route',
      {
        replacements: { userId, route },
      }
    );

    const userSubscriptions = await listUserRssSubscriptionStates(userId);
    const autoRefreshSubscriptions = await listAllRssSubscriptionStates();

    expect(userSubscriptions.some(item => item.route === route)).toBe(true);
    expect(autoRefreshSubscriptions.some(item => item.userId === userId && item.route === route)).toBe(false);
  });

  test('removes pending queue files for paused subscriptions', async () => {
    const userId = makeUserId();
    const route = makeRoute();
    createdSubscriptions.push({ userId, route });

    await upsertUserRssSubscriptionState({
      userId,
      route,
      name: route,
      feedUrl: `https://example.com${route}`,
    });

    await sequelize.query(
      'UPDATE "volix_user_rss_feed_subscribe" SET "enabled" = 0 WHERE "user_id" = :userId AND "route" = :route',
      {
        replacements: { userId, route },
      }
    );

    const dirPath = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'volix-rss-pause-'));
    tempDirs.push(dirPath);
    const taskFileName = 'queued-task.json';
    await fs.promises.writeFile(
      path.join(dirPath, taskFileName),
      JSON.stringify({
        userId,
        route,
      }),
      'utf-8'
    );

    const remained = await prunePendingTasksBySubscriptions({
      dirPath,
      taskFileNames: [taskFileName],
    });

    expect(remained).toEqual([]);
    await expect(fs.promises.stat(path.join(dirPath, taskFileName))).rejects.toThrow();
  });
});
