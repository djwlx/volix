import { getRequestActingUserId } from '../../../../utils/request-context';
import { createScopedRuntimeMap } from '../scoped-runtime-map';

type ScopedPicCacheJobQueueState = {
  activeCount: number;
  pendingList: Array<() => void>;
};

const SCOPED_PIC_CACHE_JOB_QUEUE_TTL_MS = 5 * 60 * 1000;
const MAX_SCOPED_PIC_CACHE_JOB_QUEUE_ENTRIES = 256;
export const MAX_SCOPED_PIC_CACHE_JOB_CONCURRENCY = 2;

const scopedPicCacheJobQueueStore = createScopedRuntimeMap<ScopedPicCacheJobQueueState>({
  ttlMs: SCOPED_PIC_CACHE_JOB_QUEUE_TTL_MS,
  maxEntries: MAX_SCOPED_PIC_CACHE_JOB_QUEUE_ENTRIES,
});

const getScopedPicCacheJobQueueKey = () => String(getRequestActingUserId() || 'public').trim() || 'public';

const drainScopedPicCacheJobQueue = (key: string, state: ScopedPicCacheJobQueueState) => {
  while (state.activeCount < MAX_SCOPED_PIC_CACHE_JOB_CONCURRENCY && state.pendingList.length > 0) {
    const next = state.pendingList.shift();
    if (!next) {
      continue;
    }
    state.activeCount += 1;
    next();
  }

  if (state.activeCount === 0 && state.pendingList.length === 0) {
    scopedPicCacheJobQueueStore.delete(key);
  }
};

export const runScopedPicCacheJob = async <T>(task: () => Promise<T>) => {
  const key = getScopedPicCacheJobQueueKey();
  const state = scopedPicCacheJobQueueStore.getOrCreate(key, () => ({
    activeCount: 0,
    pendingList: [],
  }));

  return new Promise<T>((resolve, reject) => {
    const run = () => {
      void Promise.resolve()
        .then(task)
        .then(resolve, reject)
        .finally(() => {
          state.activeCount = Math.max(0, state.activeCount - 1);
          drainScopedPicCacheJobQueue(key, state);
        });
    };

    state.pendingList.push(run);
    drainScopedPicCacheJobQueue(key, state);
  });
};

export const clearScopedPicCacheJobQueues = () => {
  scopedPicCacheJobQueueStore.clear();
};

export const getScopedPicCacheJobQueueSize = () => {
  return scopedPicCacheJobQueueStore.size();
};
