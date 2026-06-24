import { taskLog } from '../../../utils/logger';

export interface TaskLogger {
  info: (message: string, meta?: unknown) => void;
  warn: (message: string, meta?: unknown) => void;
  error: (message: string, meta?: unknown) => void;
}

const formatMeta = (meta?: unknown): string => {
  if (meta === undefined) {
    return '';
  }
  try {
    return ` ${JSON.stringify(meta)}`;
  } catch {
    return ` ${String(meta)}`;
  }
};

// 每条任务日志以 [task:<id>] 开头，便于在日志中心按任务 ID 关键字过滤
export const createTaskLogger = (taskId: string, name?: string): TaskLogger => {
  const label = name ? ` [${name}]` : '';
  const prefix = `[task:${taskId}]${label}`;
  return {
    info: (message, meta) => taskLog.info(`${prefix} ${message}${formatMeta(meta)}`),
    warn: (message, meta) => taskLog.warn(`${prefix} ${message}${formatMeta(meta)}`),
    error: (message, meta) => taskLog.error(`${prefix} ${message}${formatMeta(meta)}`),
  };
};
