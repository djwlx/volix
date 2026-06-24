import { ScheduledTaskType } from '@volix/types';
import type { ScheduledTaskParams } from '@volix/types';
import type { ScheduledTaskExecutor } from './executors';
import { executeAstrbotRandomPicPush } from './executors/random-pic-push.executor';
import { normalizeUmoList } from './task-param-utils';

export interface ScheduledTaskTypeDefinition {
  type: ScheduledTaskType;
  labelKey: string;
  requiresAstrbotConfig: boolean;
  normalizeParams: (params: unknown) => ScheduledTaskParams;
  executor: ScheduledTaskExecutor;
}

const taskTypeDefinitions: ScheduledTaskTypeDefinition[] = [
  {
    type: ScheduledTaskType.ASTRBOT_RANDOM_PIC,
    labelKey: 'taskCenter.type.astrbotRandomPic',
    requiresAstrbotConfig: true,
    normalizeParams: params => {
      const raw = (params && typeof params === 'object' ? params : {}) as Record<string, unknown>;
      return { umos: normalizeUmoList(raw.umos) };
    },
    executor: executeAstrbotRandomPicPush,
  },
];

const taskTypeMap = new Map(taskTypeDefinitions.map(item => [item.type, item]));

export const listTaskTypeDefinitions = (): ScheduledTaskTypeDefinition[] => taskTypeDefinitions.slice();

export const getTaskTypeDefinition = (type: ScheduledTaskType): ScheduledTaskTypeDefinition | undefined =>
  taskTypeMap.get(type);

export const isSupportedTaskType = (type: unknown): type is ScheduledTaskType =>
  typeof type === 'string' && taskTypeMap.has(type as ScheduledTaskType);

export const normalizeTaskParams = (type: ScheduledTaskType, params: unknown): ScheduledTaskParams =>
  getTaskTypeDefinition(type)?.normalizeParams(params) || {};

export const getTaskExecutor = (type: ScheduledTaskType): ScheduledTaskExecutor | undefined =>
  getTaskTypeDefinition(type)?.executor;
