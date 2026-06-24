import schedule from 'node-schedule';
import { ScheduledTaskType } from '@volix/types';
import type { ScheduledTask, ScheduledTaskParams } from '@volix/types';
import { log } from '../../../utils/logger';
import { getTaskExecutor } from './executors';
import { isValidCronExpression, listAllEnabledTasks, updateTaskRunResult } from './scheduled-task.service';
import { createTaskLogger } from './task-logger';

const scheduledJobs = new Map<string, schedule.Job>();

type TaskTrigger = 'schedule' | 'manual';

interface RunnableTask {
  id: string;
  name: string;
  userId: string;
  type: ScheduledTaskType;
  params: ScheduledTaskParams;
}

// 执行任务并记录运行结果（不抛错，避免影响调度器）
export const runScheduledTask = async (task: RunnableTask, trigger: TaskTrigger = 'schedule'): Promise<void> => {
  const logger = createTaskLogger(task.id, task.name);
  const executor = getTaskExecutor(task.type);
  if (!executor) {
    logger.warn('未找到任务执行器，已跳过', { type: task.type });
    log.warn('[task-center] 未找到任务执行器', { id: task.id, type: task.type });
    return;
  }
  const startedAt = Date.now();
  logger.info('任务开始执行', { type: task.type, trigger });
  try {
    await executor({ userId: task.userId, params: task.params, logger });
    await updateTaskRunResult(task.id, 'success');
    logger.info('任务执行成功', { costMs: Date.now() - startedAt });
    log.info('[task-center] 任务执行成功', { id: task.id, type: task.type });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await updateTaskRunResult(task.id, 'failed', message);
    logger.error('任务执行失败', { costMs: Date.now() - startedAt, error: message });
    log.warn('[task-center] 任务执行失败', { id: task.id, type: task.type, error: message });
  }
};

const cancelJob = (id: string) => {
  const existing = scheduledJobs.get(id);
  if (existing) {
    existing.cancel();
    scheduledJobs.delete(id);
  }
};

const scheduleJob = (task: RunnableTask, cron: string) => {
  cancelJob(task.id);
  if (!isValidCronExpression(cron)) {
    return;
  }
  try {
    const job = schedule.scheduleJob(cron, () => {
      void runScheduledTask(task);
    });
    if (job) {
      scheduledJobs.set(task.id, job);
    } else {
      log.warn('[task-center] 无法按 cron 创建调度任务', { id: task.id, cron });
    }
  } catch (error) {
    log.warn('[task-center] 创建调度任务异常', {
      id: task.id,
      cron,
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

// 配置变更后重排单个任务：启用且 cron 合法则（重新）调度，否则取消
export const rescheduleTask = (userId: string | number, task: ScheduledTask) => {
  if (task.enabled && isValidCronExpression(task.cron)) {
    scheduleJob(
      { id: task.id, name: task.name, userId: String(userId), type: task.type, params: task.params },
      task.cron
    );
  } else {
    cancelJob(task.id);
  }
};

export const unscheduleTask = (id: string) => {
  cancelJob(id);
};

export const startScheduledTaskScheduler = async () => {
  try {
    const tasks = await listAllEnabledTasks();
    tasks.forEach(task => {
      scheduleJob(
        { id: task.id, name: task.name, userId: task.userId, type: task.type, params: task.params },
        task.cron
      );
    });
    log.info('[task-center] 定时任务调度器已启动', { scheduled: scheduledJobs.size });
  } catch (error) {
    log.error('[task-center] 定时任务调度器启动失败', error);
  }
};
