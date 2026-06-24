import { ScheduledTaskType } from '@volix/types';

export const TASK_TYPE_OPTIONS: Array<{ value: ScheduledTaskType; labelKey: string }> = [
  { value: ScheduledTaskType.ASTRBOT_RANDOM_PIC, labelKey: 'taskCenter.type.astrbotRandomPic' },
];

export const getTaskTypeLabelKey = (type: ScheduledTaskType): string => {
  const found = TASK_TYPE_OPTIONS.find(item => item.value === type);
  return found ? found.labelKey : 'taskCenter.type.unknown';
};
