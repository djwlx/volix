import { ScheduledTaskType } from '@volix/types';
import type {
  AstrbotRandomPicTaskParams,
  ScheduledTask,
  ScheduledTaskDefaults,
  ScheduledTaskParams,
} from '@volix/types';

export const TASK_TYPE_OPTIONS: Array<{ value: ScheduledTaskType; labelKey: string }> = [
  { value: ScheduledTaskType.ASTRBOT_RANDOM_PIC, labelKey: 'taskCenter.type.astrbotRandomPic' },
];

export const getTaskTypeLabelKey = (type: ScheduledTaskType): string => {
  const found = TASK_TYPE_OPTIONS.find(item => item.value === type);
  return found ? found.labelKey : 'taskCenter.type.unknown';
};

export const createTaskTypeDraftParams = (
  type: ScheduledTaskType,
  defaults: ScheduledTaskDefaults
): ScheduledTaskParams => {
  if (type === ScheduledTaskType.ASTRBOT_RANDOM_PIC) {
    return {
      umos: defaults.taskTypeDefaults[ScheduledTaskType.ASTRBOT_RANDOM_PIC]?.umos || [],
    };
  }
  return {};
};

export const getTaskParamSummary = (task: ScheduledTask): string[] => {
  if (task.type === ScheduledTaskType.ASTRBOT_RANDOM_PIC) {
    return ((task.params as AstrbotRandomPicTaskParams)?.umos || []).filter(Boolean);
  }
  return [];
};
