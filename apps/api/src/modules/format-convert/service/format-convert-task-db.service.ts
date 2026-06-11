import { Op } from 'sequelize';
import { FORMAT_CONVERT_RECOVERABLE_STATUSES, FormatConvertTaskStatus } from '@volix/types';
import { FormatConvertTaskModel } from '../model/format-convert-task.model';
import type {
  CreateFormatConvertTaskDbPayload,
  FormatConvertTaskEntity,
  FormatConvertTaskItem,
  FormatConvertTaskSnapshot,
} from '../types/format-convert.types';

const parseJson = <T>(value: string, fallback: T) => {
  try {
    return JSON.parse(String(value || '')) as T;
  } catch {
    return fallback;
  }
};

const toIsoText = (value?: Date | string) => {
  if (!value) {
    return undefined;
  }
  if (value instanceof Date) {
    return value.toISOString();
  }
  return String(value || '').trim() || undefined;
};

export const mapFormatConvertTaskRow = (row: FormatConvertTaskEntity): FormatConvertTaskItem => {
  const snapshot: FormatConvertTaskSnapshot = {
    source: parseJson(row.source_json, {} as FormatConvertTaskSnapshot['source']),
    target: parseJson(row.target_json, {} as FormatConvertTaskSnapshot['target']),
    option: parseJson(row.option_json, {} as FormatConvertTaskSnapshot['option']),
  };

  return {
    id: Number(row.id || 0),
    userId: row.user_id,
    mode: row.mode,
    commandMode: row.command_mode,
    status: row.status,
    source: snapshot.source,
    target: snapshot.target,
    option: snapshot.option,
    presetId: row.preset_id || undefined,
    attemptCount: Number(row.attempt_count || 0),
    lastStage: row.last_stage || undefined,
    workspaceDir: row.workspace_dir || undefined,
    sourceLocalPath: row.source_local_path || undefined,
    outputLocalPath: row.output_local_path || undefined,
    logLocalPath: row.log_local_path || undefined,
    resultLocalPath: row.result_local_path || undefined,
    resultOpenlistPath: row.result_openlist_path || undefined,
    errorMessage: row.error_message || undefined,
    startedAt: toIsoText(row.started_at),
    finishedAt: toIsoText(row.finished_at),
    createdAt: toIsoText(row.created_at),
    updatedAt: toIsoText(row.updated_at),
  };
};

const mapFormatConvertTaskModelRow = (row: { dataValues: FormatConvertTaskEntity } | null) => {
  if (!row?.dataValues) {
    return null;
  }
  return mapFormatConvertTaskRow(row.dataValues);
};

export const createFormatConvertTask = async (payload: CreateFormatConvertTaskDbPayload) => {
  const row = await FormatConvertTaskModel.create({
    user_id: payload.userId,
    mode: payload.mode,
    command_mode: payload.commandMode,
    status: payload.status || FormatConvertTaskStatus.PENDING,
    source_json: JSON.stringify(payload.source || {}),
    target_json: JSON.stringify(payload.target || {}),
    option_json: JSON.stringify(payload.option || {}),
    preset_id: payload.presetId || undefined,
    attempt_count: payload.attemptCount || 0,
  });
  return mapFormatConvertTaskRow(row.dataValues as FormatConvertTaskEntity);
};

export const getFormatConvertTaskById = async (taskId: number) => {
  const row = await FormatConvertTaskModel.findOne({
    where: {
      id: taskId,
    },
  });
  return mapFormatConvertTaskModelRow(row as { dataValues: FormatConvertTaskEntity } | null);
};

export const getFormatConvertTaskByIdAndUserId = async (taskId: number, userId: string) => {
  const row = await FormatConvertTaskModel.findOne({
    where: {
      id: taskId,
      user_id: userId,
    },
  });
  return mapFormatConvertTaskModelRow(row as { dataValues: FormatConvertTaskEntity } | null);
};

export const listFormatConvertTasksByUserId = async (userId: string, limit = 50) => {
  const rows = await FormatConvertTaskModel.findAll({
    where: {
      user_id: userId,
    },
    order: [
      ['created_at', 'DESC'],
      ['id', 'DESC'],
    ],
    limit,
  });
  return rows.map(row => mapFormatConvertTaskRow(row.dataValues as FormatConvertTaskEntity));
};

export const listRecoverableFormatConvertTasks = async () => {
  const rows = await FormatConvertTaskModel.findAll({
    where: {
      status: {
        [Op.in]: [...FORMAT_CONVERT_RECOVERABLE_STATUSES],
      },
    },
    order: [
      ['created_at', 'ASC'],
      ['id', 'ASC'],
    ],
  });
  return rows.map(row => mapFormatConvertTaskRow(row.dataValues as FormatConvertTaskEntity));
};

export const findNextPendingFormatConvertTask = async () => {
  const row = await FormatConvertTaskModel.findOne({
    where: {
      status: FormatConvertTaskStatus.PENDING,
    },
    order: [
      ['created_at', 'ASC'],
      ['id', 'ASC'],
    ],
  });
  return mapFormatConvertTaskModelRow(row as { dataValues: FormatConvertTaskEntity } | null);
};

export const updateFormatConvertTask = async (taskId: number, payload: Partial<FormatConvertTaskEntity>) => {
  await FormatConvertTaskModel.update(payload, {
    where: {
      id: taskId,
    },
  });
  return getFormatConvertTaskById(taskId);
};

export const updateFormatConvertTaskStatus = async (
  taskId: number,
  status: FormatConvertTaskStatus,
  payload?: Partial<FormatConvertTaskEntity>
) => {
  return updateFormatConvertTask(taskId, {
    ...payload,
    status,
  });
};

export const resetFormatConvertTaskToPending = async (taskId: number) => {
  return updateFormatConvertTask(taskId, {
    status: FormatConvertTaskStatus.PENDING,
    last_stage: undefined,
    workspace_dir: '',
    source_local_path: '',
    output_local_path: '',
    log_local_path: '',
    error_message: '',
    started_at: undefined,
    finished_at: undefined,
  });
};
