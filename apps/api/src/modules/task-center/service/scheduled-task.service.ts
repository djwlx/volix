import { v4 as uuidv4 } from 'uuid';
import { ScheduledTaskType } from '@volix/types';
import type { ScheduledTask, ScheduledTaskParams, ScheduledTaskRunStatus } from '@volix/types';
import { ScheduledTaskModel } from '../model/scheduled-task.model';
import type { ScheduledTaskEntity } from '../model/scheduled-task.model';
import { isSupportedTaskType, normalizeTaskParams } from './task-type-registry';

export const isValidCronExpression = (cron: string): boolean => {
  const fields = String(cron || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  return fields.length === 5 || fields.length === 6;
};

const parseParams = (raw: string): ScheduledTaskParams => {
  try {
    const parsed = JSON.parse(raw || '{}');
    return parsed && typeof parsed === 'object' ? (parsed as ScheduledTaskParams) : {};
  } catch {
    return {};
  }
};

const toTask = (entity: ScheduledTaskEntity): ScheduledTask => ({
  id: entity.id,
  name: String(entity.name || ''),
  type: entity.type as ScheduledTaskType,
  enabled: Boolean(entity.enabled),
  cron: String(entity.cron || ''),
  params: parseParams(entity.params_json),
  lastRunAt: entity.last_run_at ? new Date(entity.last_run_at).toISOString() : null,
  lastRunStatus: (entity.last_run_status as ScheduledTaskRunStatus | null) || null,
  lastRunError: entity.last_run_error || null,
  createdAt: entity.created_at ? new Date(entity.created_at).toISOString() : undefined,
});

export const listUserTasks = async (userId: string | number): Promise<ScheduledTask[]> => {
  const rows = await ScheduledTaskModel.findAll({
    where: { user_id: String(userId) },
    order: [['created_at', 'ASC']],
  });
  return rows.map(row => toTask(row.dataValues));
};

export const getUserTask = async (userId: string | number, id: string): Promise<ScheduledTask | null> => {
  const row = await ScheduledTaskModel.findOne({ where: { user_id: String(userId), id } });
  return row ? toTask(row.dataValues) : null;
};

export interface UpsertTaskInput {
  name: string;
  type: ScheduledTask['type'];
  enabled: boolean;
  cron: string;
  params: ScheduledTaskParams;
}

export const createUserTask = async (userId: string | number, input: UpsertTaskInput): Promise<ScheduledTask> => {
  const created = await ScheduledTaskModel.create({
    id: uuidv4(),
    user_id: String(userId),
    name: String(input.name || '').trim(),
    type: input.type,
    enabled: Boolean(input.enabled),
    cron: String(input.cron || '').trim(),
    params_json: JSON.stringify(normalizeTaskParams(input.type, input.params)),
  });
  return toTask(created.dataValues);
};

export const updateUserTask = async (
  userId: string | number,
  id: string,
  input: Omit<UpsertTaskInput, 'type'>
): Promise<ScheduledTask | null> => {
  const row = await ScheduledTaskModel.findOne({ where: { user_id: String(userId), id } });
  if (!row) {
    return null;
  }
  const type = row.dataValues.type as ScheduledTaskType;
  await row.update({
    name: String(input.name || '').trim(),
    enabled: Boolean(input.enabled),
    cron: String(input.cron || '').trim(),
    params_json: JSON.stringify(normalizeTaskParams(type, input.params)),
  });
  return toTask(row.dataValues);
};

export const deleteUserTask = async (userId: string | number, id: string): Promise<boolean> => {
  const count = await ScheduledTaskModel.destroy({ where: { user_id: String(userId), id } });
  return count > 0;
};

export const updateTaskRunResult = async (
  id: string,
  status: ScheduledTaskRunStatus,
  error?: string
): Promise<void> => {
  await ScheduledTaskModel.update(
    {
      last_run_at: new Date(),
      last_run_status: status,
      last_run_error: error ? String(error).slice(0, 500) : null,
    },
    { where: { id } }
  );
};

export interface EnabledScheduledTask {
  id: string;
  name: string;
  userId: string;
  type: ScheduledTask['type'];
  cron: string;
  params: ScheduledTaskParams;
}

export const listAllEnabledTasks = async (): Promise<EnabledScheduledTask[]> => {
  const rows = await ScheduledTaskModel.findAll({ where: { enabled: true } });
  return rows
    .map(row => row.dataValues)
    .filter(entity => isSupportedTaskType(entity.type) && isValidCronExpression(entity.cron))
    .map(entity => ({
      id: entity.id,
      name: String(entity.name || ''),
      userId: String(entity.user_id),
      type: entity.type as ScheduledTaskType,
      cron: String(entity.cron),
      params: parseParams(entity.params_json),
    }));
};
