import { describe, expect, test } from 'vitest';
import type { ResponseData, ScheduledTaskResponse, ScheduledTaskRunResponse } from '../../packages/types/src/api';

describe('scheduled task api contracts', () => {
  test('returns scheduled task summary fields', () => {
    const task: ScheduledTaskResponse = {
      id: 'task-1',
      name: '追番巡检',
      description: '定时扫描启用中的追番订阅并触发检查',
      taskType: 'builtin',
      category: 'anime',
      status: 'idle',
      enabled: true,
      cronExpr: '0 9,21 * * *',
      timezone: 'Asia/Shanghai',
      lastRunAt: null,
      nextRunAt: '2026-04-19T01:00:00.000Z',
      lastSuccessAt: null,
      lastError: null,
      scriptLanguage: null,
      scriptContent: null,
      scriptEntryArgs: null,
      builtinHandler: 'anime.subscription.scan',
      builtinPayload: null,
      createdAt: '2026-04-18T10:00:00.000Z',
      updatedAt: '2026-04-18T10:00:00.000Z',
    };

    expect(task).toMatchObject({
      id: expect.any(String),
      name: expect.any(String),
      taskType: expect.any(String),
      category: expect.any(String),
      status: expect.any(String),
      enabled: expect.any(Boolean),
      cronExpr: expect.any(String),
      timezone: expect.any(String),
    });
  });

  test('tracks scheduled task run records', () => {
    const run: ScheduledTaskRunResponse = {
      id: 'run-1',
      taskId: 'task-1',
      triggerType: 'schedule',
      status: 'success',
      startedAt: '2026-04-18T10:00:00.000Z',
      finishedAt: '2026-04-18T10:00:05.000Z',
      durationMs: 5000,
      summary: 'download_sync_finished',
      errorMessage: null,
      logPath: 'apps/api/data/log/task/task.2026-04-18.log',
      createdAt: '2026-04-18T10:00:00.000Z',
      updatedAt: '2026-04-18T10:00:05.000Z',
    };

    expect(run).toMatchObject({
      id: expect.any(String),
      taskId: expect.any(String),
      triggerType: expect.any(String),
      status: expect.any(String),
    });
  });

  test('exposes scheduled task types through api index', () => {
    const response: ResponseData<ScheduledTaskResponse[]> = {
      code: 200,
      message: 'ok',
      data: [
        {
          id: 'task-1',
          name: '追番下载同步',
          description: '定时同步 qBittorrent 下载状态并触发后处理',
          taskType: 'builtin',
          category: 'anime',
          status: 'idle',
          enabled: true,
          cronExpr: '*/5 * * * *',
          timezone: 'Asia/Shanghai',
        },
      ],
    };

    expect(response.data[0]?.name).toBe('追番下载同步');
  });
});
