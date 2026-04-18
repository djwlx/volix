import fs from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';
import { taskLog } from '../../../utils/logger';
import { PATH } from '../../../utils/path';
import { badRequest } from '../../shared/http-handler';
import { ScheduledTaskModel } from '../model/scheduled-task.model';
import type { ScheduledTaskEntity } from '../types/scheduled-task.types';
import {
  ensureScheduledTaskRunModelReady,
  listScheduledTaskRunsByTaskId,
  toScheduledTaskRunResponse,
} from './scheduled-task-run.service';

let synced = false;

const BUILTIN_TASK_DEFINITIONS = [
  {
    id: 'anime.subscription.scan',
    name: '追番 RSS 巡检',
    description: '定时扫描启用中的追番订阅并触发检查',
    category: 'anime' as const,
    cronExpr: '0 9,21 * * *',
    timezone: 'Asia/Shanghai',
    builtinHandler: 'anime.subscription.scan',
  },
  {
    id: 'anime.download.sync',
    name: '追番下载同步',
    description: '定时同步 qBittorrent 下载状态并触发后处理',
    category: 'anime' as const,
    cronExpr: '*/5 * * * *',
    timezone: 'Asia/Shanghai',
    builtinHandler: 'anime.download.sync',
  },
];

const toIso = (value?: string | Date | null) => {
  if (!value) {
    return null;
  }
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
};

const serializeJsonText = (value?: Record<string, unknown> | null) => (value ? JSON.stringify(value) : null);

const parseJsonText = (value?: string | null) => {
  if (!value) {
    return null;
  }
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
};

const createScheduledTaskId = (prefix = 'st') => `${prefix}_${randomUUID().replace(/-/g, '').slice(0, 24)}`;

const requireScheduledTaskEntity = (entity: ScheduledTaskEntity | undefined) => {
  if (!entity) {
    badRequest('任务不存在');
    throw new Error('unreachable');
  }
  return entity;
};

export const ensureScheduledTaskModelReady = async () => {
  if (synced) {
    return;
  }
  await ScheduledTaskModel.sync();
  await ensureScheduledTaskRunModelReady();
  synced = true;
};

export const toScheduledTaskResponse = (entity: ScheduledTaskEntity) => ({
  id: entity.id,
  name: entity.name,
  description: entity.description || null,
  category: entity.category,
  taskType: entity.task_type,
  enabled: Boolean(entity.enabled),
  cronExpr: entity.cron_expr,
  timezone: entity.timezone,
  status: entity.status,
  lastRunAt: toIso(entity.last_run_at),
  nextRunAt: toIso(entity.next_run_at),
  lastSuccessAt: toIso(entity.last_success_at),
  lastError: entity.last_error || null,
  scriptLanguage: entity.script_language || null,
  scriptContent: entity.script_content || null,
  scriptEntryArgs: parseJsonText(entity.script_entry_args),
  builtinHandler: entity.builtin_handler || null,
  builtinPayload: parseJsonText(entity.builtin_payload),
  createdAt: toIso(entity.created_at) || new Date().toISOString(),
  updatedAt: toIso(entity.updated_at) || new Date().toISOString(),
});

const readLatestTaskLogLines = async (taskId: string, limit = 50) => {
  const logDir = path.join(PATH.log, 'task');
  if (!fs.existsSync(logDir)) {
    return [] as string[];
  }
  const files = fs
    .readdirSync(logDir)
    .filter(name => /^task\.\d{4}-\d{2}-\d{2}\.log$/.test(name))
    .sort()
    .reverse();
  const matched: string[] = [];
  for (const file of files) {
    const lines = fs
      .readFileSync(path.join(logDir, file), 'utf8')
      .split('\n')
      .filter(line => line.includes(`[SCHEDULED_TASK][task:${taskId}]`));
    for (let index = lines.length - 1; index >= 0; index -= 1) {
      matched.push(lines[index]);
      if (matched.length >= limit) {
        return matched;
      }
    }
  }
  return matched;
};

export const queryScheduledTaskById = async (id: string) => {
  await ensureScheduledTaskModelReady();
  const entity = await ScheduledTaskModel.findByPk(id);
  return entity?.dataValues as ScheduledTaskEntity | undefined;
};

export const listScheduledTasks = async () => {
  await ensureScheduledTaskModelReady();
  const rows = await ScheduledTaskModel.findAll({
    order: [['created_at', 'DESC']],
  });
  return rows.map(item => toScheduledTaskResponse(item.dataValues as ScheduledTaskEntity));
};

export const listScheduledTaskRuns = async (taskId: string) => {
  const runs = await listScheduledTaskRunsByTaskId(taskId, 20);
  return runs.map(toScheduledTaskRunResponse);
};

export const getScheduledTaskLogs = async (taskId: string) => ({
  logs: await readLatestTaskLogLines(taskId, 50),
});

export const getScheduledTaskDetail = async (taskId: string) => {
  const entity = requireScheduledTaskEntity(await queryScheduledTaskById(taskId));
  return {
    ...toScheduledTaskResponse(entity),
    runs: await listScheduledTaskRuns(taskId),
    logs: (await getScheduledTaskLogs(taskId)).logs,
  };
};

export const updateScheduledTaskEntity = async (id: string, payload: Partial<ScheduledTaskEntity>) => {
  await ensureScheduledTaskModelReady();
  await ScheduledTaskModel.update(payload, {
    where: { id },
  });
  return queryScheduledTaskById(id);
};

export const updateScheduledTask = async (
  id: string,
  payload: Partial<{
    name: string;
    description?: string | null;
    enabled: boolean;
    cronExpr: string;
    timezone: string;
    scriptContent?: string | null;
    scriptEntryArgs?: Record<string, unknown> | null;
    builtinPayload?: Record<string, unknown> | null;
    lastRunAt?: Date | null;
    lastSuccessAt?: Date | null;
    lastError?: string | null;
    nextRunAt?: Date | null;
    status: 'idle' | 'running' | 'paused' | 'error';
  }>
) => {
  requireScheduledTaskEntity(await queryScheduledTaskById(id));
  await updateScheduledTaskEntity(id, {
    ...(payload.name !== undefined ? { name: String(payload.name).trim() } : {}),
    ...(payload.description !== undefined ? { description: payload.description } : {}),
    ...(payload.enabled !== undefined ? { enabled: payload.enabled } : {}),
    ...(payload.cronExpr !== undefined ? { cron_expr: String(payload.cronExpr).trim() } : {}),
    ...(payload.timezone !== undefined ? { timezone: String(payload.timezone).trim() } : {}),
    ...(payload.scriptContent !== undefined ? { script_content: payload.scriptContent } : {}),
    ...(payload.scriptEntryArgs !== undefined ? { script_entry_args: serializeJsonText(payload.scriptEntryArgs) } : {}),
    ...(payload.builtinPayload !== undefined ? { builtin_payload: serializeJsonText(payload.builtinPayload) } : {}),
    ...(payload.lastRunAt !== undefined ? { last_run_at: payload.lastRunAt } : {}),
    ...(payload.lastSuccessAt !== undefined ? { last_success_at: payload.lastSuccessAt } : {}),
    ...(payload.lastError !== undefined ? { last_error: payload.lastError } : {}),
    ...(payload.nextRunAt !== undefined ? { next_run_at: payload.nextRunAt } : {}),
    ...(payload.status !== undefined ? { status: payload.status } : {}),
  });
  const { refreshScheduledTaskJobById } = await import('./scheduled-task-scheduler.service');
  await refreshScheduledTaskJobById(id);
  return toScheduledTaskResponse((await queryScheduledTaskById(id))!);
};

export const toggleScheduledTask = async (id: string) => {
  const current = requireScheduledTaskEntity(await queryScheduledTaskById(id));
  return updateScheduledTask(id, {
    enabled: !current.enabled,
    status: !current.enabled ? 'idle' : 'paused',
  });
};

export const createScheduledTask = async (
  payload: {
    name: string;
    description?: string | null;
    category?: 'anime' | 'script' | 'system' | 'custom';
    taskType?: 'builtin' | 'script';
    enabled?: boolean;
    cronExpr: string;
    timezone?: string;
    scriptLanguage?: 'javascript' | null;
    scriptContent?: string | null;
    scriptEntryArgs?: Record<string, unknown> | null;
    builtinHandler?: string | null;
    builtinPayload?: Record<string, unknown> | null;
  },
  userId?: string
) => {
  await ensureScheduledTaskModelReady();
  const entity = await ScheduledTaskModel.create({
    id: createScheduledTaskId(),
    name: String(payload.name || '').trim(),
    description: payload.description || null,
    category: payload.category || 'custom',
    task_type: payload.taskType || 'script',
    enabled: payload.enabled !== false,
    cron_expr: String(payload.cronExpr || '').trim(),
    timezone: String(payload.timezone || 'Asia/Shanghai').trim(),
    status: payload.enabled === false ? 'paused' : 'idle',
    script_language: payload.scriptLanguage || 'javascript',
    script_content: payload.scriptContent || null,
    script_entry_args: serializeJsonText(payload.scriptEntryArgs),
    builtin_handler: payload.builtinHandler || null,
    builtin_payload: serializeJsonText(payload.builtinPayload),
    created_by: userId || null,
    updated_by: userId || null,
  });
  const { refreshScheduledTaskJobById } = await import('./scheduled-task-scheduler.service');
  await refreshScheduledTaskJobById(entity.dataValues.id as string);
  return toScheduledTaskResponse((await queryScheduledTaskById(entity.dataValues.id as string))!);
};

export const upsertBuiltinTask = async (input: {
  id: string;
  name: string;
  description: string;
  category: 'anime' | 'script' | 'system' | 'custom';
  cronExpr: string;
  timezone: string;
  builtinHandler: string;
}) => {
  await ensureScheduledTaskModelReady();
  const exists = await queryScheduledTaskById(input.id);
  if (!exists) {
    await ScheduledTaskModel.create({
      id: input.id,
      name: input.name,
      description: input.description,
      category: input.category,
      task_type: 'builtin',
      enabled: true,
      cron_expr: input.cronExpr,
      timezone: input.timezone,
      status: 'idle',
      builtin_handler: input.builtinHandler,
    });
  } else {
    await ScheduledTaskModel.update(
      {
        name: input.name,
        description: input.description,
        category: input.category,
        cron_expr: input.cronExpr,
        timezone: input.timezone,
        builtin_handler: input.builtinHandler,
      },
      { where: { id: input.id } }
    );
  }
  const { refreshScheduledTaskJobById } = await import('./scheduled-task-scheduler.service');
  await refreshScheduledTaskJobById(input.id);
  return toScheduledTaskResponse((await queryScheduledTaskById(input.id))!);
};

export const ensureDefaultScheduledTasks = async () => {
  const result = [];
  for (const item of BUILTIN_TASK_DEFINITIONS) {
    result.push(await upsertBuiltinTask(item));
  }
  return result;
};

export const writeScheduledTaskLog = (
  taskId: string,
  runId: string,
  stage: string,
  message: string,
  payload?: unknown
) => {
  const suffix = payload !== undefined ? ` ${JSON.stringify(payload)}` : '';
  taskLog.info(`[SCHEDULED_TASK][task:${taskId}][run:${runId}][stage:${stage}] ${message}${suffix}`);
};

export const parseScheduledTaskEntityArgs = (entity: ScheduledTaskEntity) => ({
  scriptEntryArgs: parseJsonText(entity.script_entry_args),
  builtinPayload: parseJsonText(entity.builtin_payload),
});
