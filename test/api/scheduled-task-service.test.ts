import { beforeEach, describe, expect, test, vi } from 'vitest';

const mocked = vi.hoisted(() => ({
  queryAnimeSubscriptions: vi.fn(),
  syncAllAnimeSubscriptionDownloads: vi.fn(),
  triggerAnimeSubscriptionCheckInBackground: vi.fn(),
}));

vi.mock('../../apps/api/src/modules/anime-subscription/service/anime-subscription.service', () => ({
  queryAnimeSubscriptions: mocked.queryAnimeSubscriptions,
  syncAllAnimeSubscriptionDownloads: mocked.syncAllAnimeSubscriptionDownloads,
  triggerAnimeSubscriptionCheckInBackground: mocked.triggerAnimeSubscriptionCheckInBackground,
}));

import {
  ensureDefaultScheduledTasks,
  upsertBuiltinTask,
} from '../../apps/api/src/modules/scheduled-task/service/scheduled-task.service';
import {
  executeBuiltinScheduledTask,
  listScheduledTaskBuiltinHandlers,
} from '../../apps/api/src/modules/scheduled-task/service/scheduled-task-builtin-registry.service';

describe('scheduled task service', () => {
  beforeEach(() => {
    mocked.queryAnimeSubscriptions.mockReset();
    mocked.syncAllAnimeSubscriptionDownloads.mockReset();
    mocked.triggerAnimeSubscriptionCheckInBackground.mockReset();
  });

  test('creates built-in anime tasks during bootstrap', async () => {
    const created = await ensureDefaultScheduledTasks();

    expect(created.map(item => item.id)).toEqual(['anime.subscription.scan', 'anime.download.sync']);
  });

  test('refreshes next run time when built-in task is enabled', async () => {
    const task = await upsertBuiltinTask({
      id: 'anime.download.sync',
      name: '追番下载同步',
      description: '定时同步 qBittorrent 下载状态并触发后处理',
      category: 'anime',
      cronExpr: '*/5 * * * *',
      timezone: 'Asia/Shanghai',
      builtinHandler: 'anime.download.sync',
    });

    expect(task.enabled).toBe(true);
    expect(task.nextRunAt).toBeTruthy();
  });

  test('runs anime subscription scan handler', async () => {
    mocked.queryAnimeSubscriptions.mockResolvedValue([
      { dataValues: { id: '1', enabled: true } },
      { dataValues: { id: '2', enabled: false } },
    ]);
    mocked.triggerAnimeSubscriptionCheckInBackground.mockResolvedValue(undefined);

    const result = await executeBuiltinScheduledTask('anime.subscription.scan');

    expect(result.summary).toBe('processed:2');
    expect(mocked.triggerAnimeSubscriptionCheckInBackground).toHaveBeenCalledTimes(1);
    expect(listScheduledTaskBuiltinHandlers()).toContain('anime.subscription.scan');
  });
});
