import { Op } from 'sequelize';
import { FORMAT_CONVERT_RECOVERABLE_STATUSES, FormatConvertEngine, FormatConvertTaskStatus } from '@volix/types';
import { FormatConvertTaskModel } from '../model/format-convert-task.model';
import type {
  CreateFormatConvertTaskDbPayload,
  FormatConvertImageInfo,
  FormatConvertImageOption,
  FormatConvertImageSummary,
  FormatConvertTaskEntity,
  FormatConvertTaskItem,
  FormatConvertTaskSnapshot,
} from '../types/format-convert.types';
import { emitFormatConvertTaskCreated, emitFormatConvertTaskUpdated } from './format-convert-task-realtime.service';

const parseJson = <T>(value: string, fallback: T) => {
  try {
    return JSON.parse(String(value || '')) as T;
  } catch {
    return fallback;
  }
};

const parseOptionalJson = <T>(value?: string) => {
  if (!String(value || '').trim()) {
    return undefined;
  }
  const parsed = parseJson(value || '', {} as T);
  if (parsed && typeof parsed === 'object' && !Array.isArray(parsed) && Object.keys(parsed as object).length === 0) {
    return undefined;
  }
  return parsed;
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
    sourceMediaInfo: parseOptionalJson(row.source_media_info_json),
    convertSummary: parseOptionalJson(row.convert_summary_json),
    resultMediaInfo: parseOptionalJson(row.result_media_info_json),
  };

  const engine = (row.engine as FormatConvertEngine) || FormatConvertEngine.MEDIA;
  const isImage = engine === FormatConvertEngine.IMAGE;

  return {
    id: Number(row.id || 0),
    userId: row.user_id,
    mode: row.mode,
    engine,
    commandMode: row.command_mode,
    status: row.status,
    source: snapshot.source,
    target: snapshot.target,
    option: snapshot.option,
    sourceMediaInfo: isImage ? undefined : snapshot.sourceMediaInfo,
    convertSummary: isImage ? undefined : snapshot.convertSummary,
    resultMediaInfo: isImage ? undefined : snapshot.resultMediaInfo,
    imageOption: isImage ? parseJson(row.option_json, {} as FormatConvertImageOption) : undefined,
    sourceImageInfo: isImage ? parseOptionalJson<FormatConvertImageInfo>(row.source_media_info_json) : undefined,
    resultImageInfo: isImage ? parseOptionalJson<FormatConvertImageInfo>(row.result_media_info_json) : undefined,
    imageSummary: isImage ? parseOptionalJson<FormatConvertImageSummary>(row.convert_summary_json) : undefined,
    presetId: row.preset_id || undefined,
    attemptCount: Number(row.attempt_count || 0),
    requestUserAgent: row.request_user_agent || undefined,
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
    engine: payload.engine || FormatConvertEngine.MEDIA,
    command_mode: payload.commandMode,
    status: payload.status || FormatConvertTaskStatus.PENDING,
    source_json: JSON.stringify(payload.source || {}),
    target_json: JSON.stringify(payload.target || {}),
    option_json: JSON.stringify(payload.option || {}),
    source_media_info_json: JSON.stringify(payload.sourceMediaInfo || {}),
    convert_summary_json: JSON.stringify(payload.convertSummary || {}),
    result_media_info_json: JSON.stringify(payload.resultMediaInfo || {}),
    preset_id: payload.presetId || undefined,
    attempt_count: payload.attemptCount || 0,
    request_user_agent: payload.requestUserAgent || undefined,
  });
  const task = mapFormatConvertTaskRow(row.dataValues as FormatConvertTaskEntity);
  await emitFormatConvertTaskCreated(task);
  return task;
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

export const listFormatConvertTasksByIdsAndUserId = async (taskIds: number[], userId: string) => {
  if (!taskIds.length) {
    return [];
  }
  const rows = await FormatConvertTaskModel.findAll({
    where: {
      id: {
        [Op.in]: taskIds,
      },
      user_id: userId,
    },
    order: [
      ['created_at', 'DESC'],
      ['id', 'DESC'],
    ],
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
  const task = await getFormatConvertTaskById(taskId);
  if (task) {
    await emitFormatConvertTaskUpdated(task);
  }
  return task;
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

export const deleteFormatConvertTaskByIdAndUserId = async (taskId: number, userId: string) => {
  return FormatConvertTaskModel.destroy({
    where: {
      id: taskId,
      user_id: userId,
    },
  });
};

export const deleteFormatConvertTasksByIdsAndUserId = async (taskIds: number[], userId: string) => {
  if (!taskIds.length) {
    return 0;
  }
  return FormatConvertTaskModel.destroy({
    where: {
      id: {
        [Op.in]: taskIds,
      },
      user_id: userId,
    },
  });
};
