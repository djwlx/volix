import { emitWebsocketEventToUser } from '../../shared/websocket/ws-server';
import type { FormatConvertTaskItem } from '../types/format-convert.types';

type PublicFormatConvertTask = Omit<FormatConvertTaskItem, 'requestUserAgent'>;

const toPublicFormatConvertTask = (task: FormatConvertTaskItem): PublicFormatConvertTask => {
  const { requestUserAgent: _requestUserAgent, ...publicTask } = task;
  return publicTask;
};

export const emitFormatConvertTaskCreated = async (task: FormatConvertTaskItem) => {
  emitWebsocketEventToUser(String(task.userId), 'format-convert.task.created', toPublicFormatConvertTask(task));
};

export const emitFormatConvertTaskUpdated = async (task: FormatConvertTaskItem) => {
  emitWebsocketEventToUser(String(task.userId), 'format-convert.task.updated', toPublicFormatConvertTask(task));
};

export const emitFormatConvertTaskDeleted = (userId: string, taskId: number) => {
  emitWebsocketEventToUser(userId, 'format-convert.task.deleted', { taskId });
};
