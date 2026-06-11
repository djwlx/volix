import { FORMAT_CONVERT_RECOVERABLE_STATUSES, type FormatConvertTaskStatus } from '@volix/types';
import { log } from '../../../utils/logger';
import { runFormatConvertTask } from './format-convert-runner.service';
import {
  findNextPendingFormatConvertTask,
  listRecoverableFormatConvertTasks,
  resetFormatConvertTaskToPending,
} from './format-convert-task-db.service';
import { cleanupFormatConvertWorkspace } from './format-convert-workspace.service';

let queueJob: Promise<void> | null = null;

export const collectRecoverableTasks = (statuses: FormatConvertTaskStatus[]) => {
  return statuses.filter(status => FORMAT_CONVERT_RECOVERABLE_STATUSES.includes(status as never));
};

const consumeFormatConvertQueue = async () => {
  while (true) {
    const task = await findNextPendingFormatConvertTask();
    if (!task) {
      return;
    }
    try {
      await runFormatConvertTask(task);
    } catch (error) {
      log.warn('[format-convert] task run failed', {
        taskId: task.id,
        error,
      });
    }
  }
};

export const ensureFormatConvertQueueRunning = () => {
  if (queueJob) {
    return queueJob;
  }
  queueJob = consumeFormatConvertQueue().finally(() => {
    queueJob = null;
  });
  return queueJob;
};

export const recoverAndStartFormatConvertQueue = async () => {
  const tasks = await listRecoverableFormatConvertTasks();
  for (const task of tasks) {
    if (task.workspaceDir) {
      await cleanupFormatConvertWorkspace(task.workspaceDir);
    }
    await resetFormatConvertTaskToPending(task.id);
  }
  await ensureFormatConvertQueueRunning();
};
