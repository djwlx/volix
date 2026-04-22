import fs from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';
import { PATH } from '../../../utils/path';
import type { ScheduledTaskRunEntity } from '../types/scheduled-task.types';

interface PersistedScheduledTaskRun {
  id: string;
  task_id: string;
  trigger_type: ScheduledTaskRunEntity['trigger_type'];
  status: ScheduledTaskRunEntity['status'];
  started_at?: string | null;
  finished_at?: string | null;
  duration_ms?: number | null;
  summary?: string | null;
  error_message?: string | null;
  log_path?: string | null;
  created_at?: string;
  updated_at?: string;
}

const SCHEDULED_TASK_RUN_CACHE_DIR = path.join(PATH.cache, 'scheduled-task', 'runs');
const MAX_PERSISTED_RUNS_PER_TASK = 100;

const ensureScheduledTaskRunCacheDir = () => {
  fs.mkdirSync(SCHEDULED_TASK_RUN_CACHE_DIR, { recursive: true });
};

const getScheduledTaskRunCachePath = (taskId: string) => {
  ensureScheduledTaskRunCacheDir();
  return path.join(SCHEDULED_TASK_RUN_CACHE_DIR, `${taskId}.json`);
};

const toIso = (value?: string | Date | null) => {
  if (!value) {
    return null;
  }
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
};

const toPersistedRun = (entity: ScheduledTaskRunEntity): PersistedScheduledTaskRun => ({
  id: entity.id,
  task_id: entity.task_id,
  trigger_type: entity.trigger_type,
  status: entity.status,
  started_at: toIso(entity.started_at),
  finished_at: toIso(entity.finished_at),
  duration_ms: entity.duration_ms ?? null,
  summary: entity.summary || null,
  error_message: entity.error_message || null,
  log_path: entity.log_path || null,
  created_at: toIso(entity.created_at) || new Date().toISOString(),
  updated_at: toIso(entity.updated_at) || new Date().toISOString(),
});

const toEntity = (entity: PersistedScheduledTaskRun): ScheduledTaskRunEntity => ({
  id: entity.id,
  task_id: entity.task_id,
  trigger_type: entity.trigger_type,
  status: entity.status,
  started_at: entity.started_at ? new Date(entity.started_at) : null,
  finished_at: entity.finished_at ? new Date(entity.finished_at) : null,
  duration_ms: entity.duration_ms ?? null,
  summary: entity.summary || null,
  error_message: entity.error_message || null,
  log_path: entity.log_path || null,
  created_at: entity.created_at ? new Date(entity.created_at) : undefined,
  updated_at: entity.updated_at ? new Date(entity.updated_at) : undefined,
});

const readTaskRuns = (taskId: string) => {
  const filePath = getScheduledTaskRunCachePath(taskId);
  if (!fs.existsSync(filePath)) {
    return [] as PersistedScheduledTaskRun[];
  }
  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as PersistedScheduledTaskRun[]) : [];
  } catch {
    return [];
  }
};

const writeTaskRuns = (taskId: string, runs: PersistedScheduledTaskRun[]) => {
  const filePath = getScheduledTaskRunCachePath(taskId);
  fs.writeFileSync(filePath, JSON.stringify(runs.slice(0, MAX_PERSISTED_RUNS_PER_TASK), null, 2), 'utf8');
};

export const ensureScheduledTaskRunModelReady = async () => {
  ensureScheduledTaskRunCacheDir();
};

export const toScheduledTaskRunResponse = (entity: ScheduledTaskRunEntity) => ({
  id: entity.id,
  taskId: entity.task_id,
  triggerType: entity.trigger_type,
  status: entity.status,
  startedAt: toIso(entity.started_at),
  finishedAt: toIso(entity.finished_at),
  durationMs: entity.duration_ms ?? null,
  summary: entity.summary || null,
  errorMessage: entity.error_message || null,
  logPath: entity.log_path || null,
  createdAt: toIso(entity.created_at) || new Date().toISOString(),
  updatedAt: toIso(entity.updated_at) || new Date().toISOString(),
});

export const createScheduledTaskRun = async (payload: Omit<ScheduledTaskRunEntity, 'id'>) => {
  await ensureScheduledTaskRunModelReady();
  const now = new Date();
  const entity: ScheduledTaskRunEntity = {
    id: `str_${randomUUID().replace(/-/g, '').slice(0, 24)}`,
    ...payload,
    created_at: payload.created_at || now,
    updated_at: payload.updated_at || now,
  };
  const taskId = String(entity.task_id);
  const runs = readTaskRuns(taskId);
  runs.unshift(toPersistedRun(entity));
  writeTaskRuns(taskId, runs);
  return entity;
};

export const updateScheduledTaskRun = async (id: string, payload: Partial<ScheduledTaskRunEntity>) => {
  await ensureScheduledTaskRunModelReady();
  const fileNames = fs.existsSync(SCHEDULED_TASK_RUN_CACHE_DIR) ? fs.readdirSync(SCHEDULED_TASK_RUN_CACHE_DIR) : [];

  for (const fileName of fileNames) {
    if (!fileName.endsWith('.json')) {
      continue;
    }
    const taskId = fileName.slice(0, -5);
    const runs = readTaskRuns(taskId);
    const index = runs.findIndex(item => item.id === id);
    if (index < 0) {
      continue;
    }

    const current = toEntity(runs[index]!);
    const nextEntity: ScheduledTaskRunEntity = {
      ...current,
      ...payload,
      updated_at: new Date(),
    };
    runs[index] = toPersistedRun(nextEntity);
    writeTaskRuns(taskId, runs);
    return nextEntity;
  }

  return undefined;
};

export const listScheduledTaskRunsByTaskId = async (taskId: string, limit = 20) => {
  await ensureScheduledTaskRunModelReady();
  return readTaskRuns(taskId).slice(0, limit).map(toEntity);
};
