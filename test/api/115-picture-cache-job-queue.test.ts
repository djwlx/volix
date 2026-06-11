import { describe, expect, test } from 'vitest';
import { runWithRequestContext } from '../../apps/api/src/utils/request-context';
import {
  clearScopedPicCacheJobQueues,
  getScopedPicCacheJobQueueSize,
  MAX_SCOPED_PIC_CACHE_JOB_CONCURRENCY,
  runScopedPicCacheJob,
} from '../../apps/api/src/modules/115/service/picture/picture-cache-job-queue';

const waitForTick = async () => {
  await Promise.resolve();
  await Promise.resolve();
};

const waitForTicks = async (count: number) => {
  for (let index = 0; index < count; index += 1) {
    await waitForTick();
  }
};

describe('115 picture cache job queue', () => {
  test('limits concurrent jobs per scope and releases idle scopes', async () => {
    clearScopedPicCacheJobQueues();

    let activeCount = 0;
    let maxActiveCount = 0;
    const releases: Array<() => void> = [];

    const createJob = (value: string) =>
      runWithRequestContext({ actingUserId: 'user-a' }, () =>
        runScopedPicCacheJob(async () => {
          activeCount += 1;
          maxActiveCount = Math.max(maxActiveCount, activeCount);
          await new Promise<void>(resolve => {
            releases.push(() => {
              activeCount -= 1;
              resolve();
            });
          });
          return value;
        })
      );

    const first = createJob('first');
    const second = createJob('second');
    const third = createJob('third');

    await waitForTicks(4);

    expect(maxActiveCount).toBe(MAX_SCOPED_PIC_CACHE_JOB_CONCURRENCY);
    expect(releases).toHaveLength(MAX_SCOPED_PIC_CACHE_JOB_CONCURRENCY);
    expect(getScopedPicCacheJobQueueSize()).toBe(1);

    releases.shift()?.();
    await waitForTicks(4);

    expect(maxActiveCount).toBe(MAX_SCOPED_PIC_CACHE_JOB_CONCURRENCY);
    expect(releases).toHaveLength(MAX_SCOPED_PIC_CACHE_JOB_CONCURRENCY);

    while (releases.length > 0) {
      releases.shift()?.();
      await waitForTick();
    }

    await expect(Promise.all([first, second, third])).resolves.toEqual(['first', 'second', 'third']);
    expect(getScopedPicCacheJobQueueSize()).toBe(0);
  });
});
