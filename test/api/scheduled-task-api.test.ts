import { describe, expect, test } from 'vitest';
import type {
  CreateScheduledTaskPayload,
  ListScheduledTasksResponse,
  ScheduledTask,
  ScheduledTaskDefaults,
} from '../../packages/types/src/api';
import { ScheduledTaskType } from '../../packages/types/src/api';

describe('scheduled task api contracts', () => {
  test('returns scheduled task summary fields', () => {
    const task: ScheduledTask = {
      id: 'task-1',
      name: 'AstrBot 每日随机图',
      type: ScheduledTaskType.ASTRBOT_RANDOM_PIC,
      enabled: true,
      cron: '0 9 * * *',
      params: {
        umos: ['qq:group:10001'],
      },
      lastRunAt: '2026-06-24T01:00:00.000Z',
      nextRunAt: '2026-06-25T01:00:00.000Z',
      lastRunStatus: 'success',
      lastRunError: null,
      createdAt: '2026-06-24T00:00:00.000Z',
    };

    expect(task).toMatchObject({
      id: expect.any(String),
      name: expect.any(String),
      type: ScheduledTaskType.ASTRBOT_RANDOM_PIC,
      enabled: expect.any(Boolean),
      cron: expect.any(String),
      nextRunAt: expect.any(String),
    });
  });

  test('returns type-scoped task defaults for the task center', () => {
    const defaults: ScheduledTaskDefaults = {
      taskTypeDefaults: {
        [ScheduledTaskType.ASTRBOT_RANDOM_PIC]: {
          umos: ['qq:group:10001'],
        },
      },
    };

    const response: ListScheduledTasksResponse = {
      tasks: [],
      defaults,
    };

    expect(response.defaults.taskTypeDefaults[ScheduledTaskType.ASTRBOT_RANDOM_PIC]?.umos).toEqual(['qq:group:10001']);
  });

  test('accepts a built-in task payload with typed params', () => {
    const payload: CreateScheduledTaskPayload = {
      name: 'AstrBot 每日随机图',
      type: ScheduledTaskType.ASTRBOT_RANDOM_PIC,
      enabled: true,
      cron: '0 9 * * *',
      params: {
        umos: ['qq:group:10001'],
      },
    };

    expect(payload.type).toBe(ScheduledTaskType.ASTRBOT_RANDOM_PIC);
    expect(payload.params).toMatchObject({ umos: ['qq:group:10001'] });
  });
});
