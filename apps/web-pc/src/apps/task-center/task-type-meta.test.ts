import { describe, expect, it } from 'vitest';
import type { ScheduledTask } from '@volix/types';
import { ScheduledTaskType } from '@volix/types';
import {
  createTaskTypeDraftParams,
  getTaskParamSummary,
  getTaskTypeLabelKey,
  TASK_TYPE_OPTIONS,
} from './task-type-meta';

describe('task type meta', () => {
  it('creates draft params from task type defaults', () => {
    expect(
      createTaskTypeDraftParams(ScheduledTaskType.ASTRBOT_RANDOM_PIC, {
        taskTypeDefaults: {
          [ScheduledTaskType.ASTRBOT_RANDOM_PIC]: {
            umos: ['qq:group:10001'],
          },
        },
      })
    ).toEqual({
      umos: ['qq:group:10001'],
    });
  });

  it('builds task param summary from the task type', () => {
    const task: ScheduledTask = {
      id: 'task-1',
      name: 'AstrBot 每日随机图',
      type: ScheduledTaskType.ASTRBOT_RANDOM_PIC,
      enabled: true,
      cron: '0 9 * * *',
      params: {
        umos: ['qq:group:10001', 'telegram:private:42'],
      },
    };

    expect(getTaskParamSummary(task)).toEqual(['qq:group:10001', 'telegram:private:42']);
  });

  it('maps type options to i18n keys', () => {
    expect(TASK_TYPE_OPTIONS).toEqual([
      { value: ScheduledTaskType.ASTRBOT_RANDOM_PIC, labelKey: 'taskCenter.type.astrbotRandomPic' },
    ]);
    expect(getTaskTypeLabelKey(ScheduledTaskType.ASTRBOT_RANDOM_PIC)).toBe('taskCenter.type.astrbotRandomPic');
  });
});
