import fs from 'fs';
import path from 'path';
import type { LogViewerEntriesResponse, LogViewerLevel, LogViewerType } from '@volix/types';
import { PATH } from '../../../utils/path';
import { badRequest } from '../../shared/http-handler';
import { t } from '../../../utils/i18n';
import { parseLogContent, queryEntries } from './log-viewer.parser';

const TAIL_CAP_BYTES = 5 * 1024 * 1024;
const DATE_REGEXP = /^\d{4}-\d{2}-\d{2}$/;

const resolveTarget = (type: LogViewerType): { dir: string; base: string } => {
  if (type === 'normal') {
    return { dir: path.join(PATH.log, 'normal'), base: 'normal' };
  }
  if (type === 'database') {
    return { dir: path.join(PATH.log, 'databse'), base: 'database' };
  }
  return badRequest(t({ id: 'logViewer.error.invalidType', defaultMessage: '日志类型错误' }));
};

const assertValidDate = (date: string): string => {
  if (!DATE_REGEXP.test(date)) {
    return badRequest(t({ id: 'logViewer.error.invalidDate', defaultMessage: '日志日期错误' }));
  }
  return date;
};

const readBoundedTail = async (filePath: string): Promise<string> => {
  const stat = await fs.promises.stat(filePath);
  if (stat.size <= TAIL_CAP_BYTES) {
    return fs.promises.readFile(filePath, 'utf-8');
  }
  const start = stat.size - TAIL_CAP_BYTES;
  const handle = await fs.promises.open(filePath, 'r');
  try {
    const buffer = Buffer.alloc(TAIL_CAP_BYTES);
    await handle.read(buffer, 0, TAIL_CAP_BYTES, start);
    const text = buffer.toString('utf-8');
    const newlineIndex = text.indexOf('\n');
    return newlineIndex >= 0 ? text.slice(newlineIndex + 1) : text;
  } finally {
    await handle.close();
  }
};

export const listLogDates = async (type: LogViewerType): Promise<string[]> => {
  const { dir, base } = resolveTarget(type);
  const fileRegexp = new RegExp(`^${base}\\.(\\d{4}-\\d{2}-\\d{2})\\.log$`);
  const entries = await fs.promises.readdir(dir).catch(() => [] as string[]);
  const dates = new Set<string>();
  for (const name of entries) {
    const matched = name.match(fileRegexp);
    if (matched?.[1]) {
      dates.add(matched[1]);
    }
  }
  return Array.from(dates).sort((a, b) => (a < b ? 1 : a > b ? -1 : 0));
};

export const getLogFilePath = (type: LogViewerType, date: string): { filePath: string; fileName: string } => {
  const { dir, base } = resolveTarget(type);
  const safeDate = assertValidDate(date);
  const fileName = `${base}.${safeDate}.log`;
  return { filePath: path.join(dir, fileName), fileName };
};

export const readLogEntries = async (
  type: LogViewerType,
  date: string,
  options: { levels?: LogViewerLevel[]; keyword?: string; page?: number; pageSize?: number }
): Promise<LogViewerEntriesResponse> => {
  const { filePath } = getLogFilePath(type, date);
  const exists = await fs.promises
    .access(filePath, fs.constants.F_OK)
    .then(() => true)
    .catch(() => false);
  if (!exists) {
    return { items: [], total: 0 };
  }
  const content = await readBoundedTail(filePath);
  const entries = parseLogContent(content);
  return queryEntries(entries, options);
};
