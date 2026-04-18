import schedule from 'node-schedule';
import { ScheduledTaskModel } from '../model/scheduled-task.model';
import type { ScheduledTaskEntity } from '../types/scheduled-task.types';
import { createScheduledTaskRun, updateScheduledTaskRun } from './scheduled-task-run.service';
import {
  ensureDefaultScheduledTasks,
  ensureScheduledTaskModelReady,
  parseScheduledTaskEntityArgs,
  queryScheduledTaskById,
  updateScheduledTaskEntity,
  writeScheduledTaskLog,
} from './scheduled-task.service';
import { executeBuiltinScheduledTask } from './scheduled-task-builtin-registry.service';
import { runScheduledTaskScript } from './scheduled-task-script-runtime.service';

const jobs = new Map<string, schedule.Job>();
let started = false;

const toNextRunAt = (job?: schedule.Job | null) => {
  const next = job?.nextInvocation();
  return next ? next.toDate() : null;
};

const buildScriptContext = (task: ScheduledTaskEntity, triggerType: 'schedule' | 'manual' | 'ai', runId: string) => ({
  logger: {
    info: (message: string, payload?: unknown) => writeScheduledTaskLog(task.id, runId, 'info', message, payload),
    warn: (message: string, payload?: unknown) => writeScheduledTaskLog(task.id, runId, 'warn', message, payload),
    error: (message: string, payload?: unknown) => writeScheduledTaskLog(task.id, runId, 'error', message, payload),
  },
  task: {
    id: task.id,
    name: task.name,
    triggerType,
    args: parseScheduledTaskEntityArgs(task).scriptEntryArgs || {},
  },
});

export const executeScheduledTask = async (task: ScheduledTaskEntity, triggerType: 'schedule' | 'manual' | 'ai') => {
  const run = await createScheduledTaskRun({
    task_id: task.id,
    trigger_type: triggerType,
    status: 'running',
    started_at: new Date(),
    log_path: `${task.id}`,
  });
  await updateScheduledTaskEntity(task.id, {
    status: 'running',
    last_run_at: run.started_at || new Date(),
    last_error: null,
  });
  writeScheduledTaskLog(task.id, run.id, 'start', `trigger=${triggerType}`);

  try {
    const result =
      task.task_type === 'builtin'
        ? await executeBuiltinScheduledTask(String(task.builtin_handler || ''))
        : await runScheduledTaskScript(
            String(task.script_content || ''),
            buildScriptContext(task, triggerType, run.id)
          );

    const finishedAt = new Date();
    const durationMs = run.started_at ? finishedAt.getTime() - new Date(run.started_at).getTime() : null;
    await updateScheduledTaskRun(run.id, {
      status: 'success',
      finished_at: finishedAt,
      duration_ms: durationMs,
      summary:
        typeof result === 'object' && result && 'summary' in (result as Record<string, unknown>)
          ? String((result as Record<string, unknown>).summary || '')
          : 'success',
    });
    await updateScheduledTaskEntity(task.id, {
      status: task.enabled ? 'idle' : 'paused',
      last_success_at: finishedAt,
      last_error: null,
    });
    writeScheduledTaskLog(task.id, run.id, 'finish', 'success');
  } catch (error) {
    const message = (error as Error)?.message || 'scheduled_task_failed';
    const finishedAt = new Date();
    const durationMs = run.started_at ? finishedAt.getTime() - new Date(run.started_at).getTime() : null;
    await updateScheduledTaskRun(run.id, {
      status: 'failed',
      finished_at: finishedAt,
      duration_ms: durationMs,
      error_message: message,
      summary: 'failed',
    });
    await updateScheduledTaskEntity(task.id, {
      status: 'error',
      last_error: message,
    });
    writeScheduledTaskLog(task.id, run.id, 'error', message);
    throw error;
  } finally {
    await refreshScheduledTaskJobById(task.id);
  }
};

export const triggerScheduledTaskNow = async (taskId: string, triggerType: 'manual' | 'ai' = 'manual') => {
  const task = await queryScheduledTaskById(taskId);
  if (!task) {
    throw new Error('任务不存在');
  }
  await executeScheduledTask(task, triggerType);
  return (await queryScheduledTaskById(taskId))!;
};

export const refreshScheduledTaskJobByEntity = async (task: ScheduledTaskEntity) => {
  jobs.get(task.id)?.cancel();
  jobs.delete(task.id);

  if (!task.enabled) {
    await updateScheduledTaskEntity(task.id, {
      status: 'paused',
      next_run_at: null,
    });
    return null;
  }

  const job = schedule.scheduleJob({ rule: task.cron_expr, tz: task.timezone }, async () => {
    const latest = await queryScheduledTaskById(task.id);
    if (!latest) {
      return;
    }
    await executeScheduledTask(latest, 'schedule');
  });
  jobs.set(task.id, job);
  const nextRunAt = toNextRunAt(job);
  await updateScheduledTaskEntity(task.id, {
    next_run_at: nextRunAt,
    status: task.status === 'error' ? 'error' : 'idle',
  });
  return nextRunAt;
};

export const refreshScheduledTaskJobById = async (taskId: string) => {
  const task = await queryScheduledTaskById(taskId);
  if (!task) {
    jobs.get(taskId)?.cancel();
    jobs.delete(taskId);
    return null;
  }
  return refreshScheduledTaskJobByEntity(task);
};

export const initializeScheduledTaskPlatform = async () => {
  if (started) {
    return;
  }
  started = true;
  await ensureScheduledTaskModelReady();
  await ensureDefaultScheduledTasks();
  const rows = await ScheduledTaskModel.findAll();
  for (const row of rows) {
    await refreshScheduledTaskJobByEntity(row.dataValues as ScheduledTaskEntity);
  }
};
