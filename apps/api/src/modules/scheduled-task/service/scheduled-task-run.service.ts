import { randomUUID } from 'crypto';
import { ScheduledTaskRunModel } from '../model/scheduled-task-run.model';
import type { ScheduledTaskRunEntity } from '../types/scheduled-task.types';

let synced = false;

export const ensureScheduledTaskRunModelReady = async () => {
  if (synced) {
    return;
  }
  await ScheduledTaskRunModel.sync();
  synced = true;
};

const toIso = (value?: string | Date | null) => {
  if (!value) {
    return null;
  }
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
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
  const entity = await ScheduledTaskRunModel.create({
    id: `str_${randomUUID().replace(/-/g, '').slice(0, 24)}`,
    ...payload,
  });
  return entity.dataValues as ScheduledTaskRunEntity;
};

export const updateScheduledTaskRun = async (id: string, payload: Partial<ScheduledTaskRunEntity>) => {
  await ensureScheduledTaskRunModelReady();
  await ScheduledTaskRunModel.update(payload, {
    where: { id },
  });
  const entity = await ScheduledTaskRunModel.findByPk(id);
  return entity?.dataValues as ScheduledTaskRunEntity | undefined;
};

export const listScheduledTaskRunsByTaskId = async (taskId: string, limit = 20) => {
  await ensureScheduledTaskRunModelReady();
  const rows = await ScheduledTaskRunModel.findAll({
    where: { task_id: taskId },
    order: [['created_at', 'DESC']],
    limit,
  });
  return rows.map(item => item.dataValues as ScheduledTaskRunEntity);
};
