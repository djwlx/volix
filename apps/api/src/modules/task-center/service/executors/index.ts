import { ScheduledTaskType } from '@volix/types';
import type { ScheduledTaskParams } from '@volix/types';
import type { TaskLogger } from '../task-logger';
import { executeAstrbotRandomPicPush } from './random-pic-push.executor';

export interface ScheduledTaskExecutorContext {
  userId: string;
  params: ScheduledTaskParams;
  logger: TaskLogger;
}

export type ScheduledTaskExecutor = (ctx: ScheduledTaskExecutorContext) => Promise<void>;

// 任务类型 -> 执行器。新增定时任务类型时在此注册即可。
const executorRegistry: Record<ScheduledTaskType, ScheduledTaskExecutor> = {
  [ScheduledTaskType.ASTRBOT_RANDOM_PIC]: executeAstrbotRandomPicPush,
};

export const getTaskExecutor = (type: ScheduledTaskType): ScheduledTaskExecutor | undefined => executorRegistry[type];
