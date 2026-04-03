import { log } from '../../../utils/logger';
import { runDueAnimeSyncSubscriptions } from './anime-sync.service';

let animeSyncTimer: NodeJS.Timeout | null = null;
let running = false;

export const startAnimeSyncScheduler = () => {
  if (animeSyncTimer) {
    return;
  }

  const tick = async () => {
    if (running) {
      return;
    }
    running = true;
    try {
      const result = await runDueAnimeSyncSubscriptions();
      if (
        result.scannedSubscriptionCount > 0 ||
        result.discoveredJobCount > 0 ||
        (result.processedJobCount || 0) > 0 ||
        (result.failedJobCount || 0) > 0 ||
        (result.completedJobCount || 0) > 0
      ) {
        log.info(
          `[anime-sync] 轮询完成 scanned=${result.scannedSubscriptionCount} discovered=${result.discoveredJobCount} processed=${result.processedJobCount || 0} failed=${result.failedJobCount || 0} completed=${result.completedJobCount || 0}`
        );
      }
    } catch (error) {
      log.error('[anime-sync] 定时轮询失败', error);
    } finally {
      running = false;
    }
  };

  // 启动后先跑一次，再每分钟跑一次。
  void tick();
  animeSyncTimer = setInterval(() => {
    void tick();
  }, 60 * 1000);

  log.info('[anime-sync] 调度器已启动（每 60 秒轮询）');
};

export const stopAnimeSyncScheduler = () => {
  if (!animeSyncTimer) {
    return;
  }
  clearInterval(animeSyncTimer);
  animeSyncTimer = null;
  running = false;
  log.info('[anime-sync] 调度器已停止');
};
