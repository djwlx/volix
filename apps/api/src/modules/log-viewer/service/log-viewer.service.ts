import fs from 'fs';
import path from 'path';
import type { LogViewerEntriesResponse, LogViewerLevel, LogViewerType } from '@volix/types';
import { PATH } from '../../../utils/path';
import { badRequest } from '../../shared/http-handler';
import { t } from '../../../utils/i18n';
import { parseLogContent, queryEntries } from './log-viewer.parser';

const TAIL_CAP_BYTES = 5 * 1024 * 1024;
const DATE_REGEXP = /^\d{4}-\d{2}-\d{2}$/;

type ResolvedLogFile = {
  date: string;
  fileName: string;
  filePath: string;
  rotationIndex: number;
};

const resolveTarget = (type: LogViewerType): { dir: string; base: string } => {
  if (type === 'normal') {
    return { dir: path.join(PATH.log, 'normal'), base: 'normal' };
  }
  if (type === 'database') {
    return { dir: path.join(PATH.log, 'databse'), base: 'database' };
  }
  if (type === 'task') {
    return { dir: path.join(PATH.log, 'task'), base: 'task' };
  }
  return badRequest(t({ id: 'logViewer.error.invalidType', defaultMessage: '日志类型错误' }));
};

const assertValidDate = (date: string): string => {
  if (!DATE_REGEXP.test(date)) {
    return badRequest(t({ id: 'logViewer.error.invalidDate', defaultMessage: '日志日期错误' }));
  }
  return date;
};

const parseLogFile = (base: string, dir: string, fileName: string): ResolvedLogFile | null => {
  const fileRegexp = new RegExp(`^${base}\\.(\\d{4}-\\d{2}-\\d{2})\\.log(?:\\.(\\d+))?$`);
  const matched = fileName.match(fileRegexp);
  if (!matched?.[1]) {
    return null;
  }

  return {
    date: matched[1],
    fileName,
    filePath: path.join(dir, fileName),
    rotationIndex: Number(matched[2] || 0),
  };
};

const listResolvedLogFiles = async (dir: string, base: string): Promise<ResolvedLogFile[]> => {
  const entries = await fs.promises.readdir(dir).catch(() => [] as string[]);
  return entries
    .map(fileName => parseLogFile(base, dir, fileName))
    .filter((item): item is ResolvedLogFile => item !== null);
};

const sortByRotationForRead = (files: ResolvedLogFile[]) =>
  files.slice().sort((left, right) => {
    if (left.rotationIndex === right.rotationIndex) {
      return left.fileName.localeCompare(right.fileName);
    }
    if (left.rotationIndex === 0) {
      return 1;
    }
    if (right.rotationIndex === 0) {
      return -1;
    }
    return right.rotationIndex - left.rotationIndex;
  });

const sortByRotationForPreferredFile = (files: ResolvedLogFile[]) =>
  files.slice().sort((left, right) => {
    if (left.rotationIndex === right.rotationIndex) {
      return left.fileName.localeCompare(right.fileName);
    }
    return left.rotationIndex - right.rotationIndex;
  });

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
  const dates = new Set<string>();
  const files = await listResolvedLogFiles(dir, base);
  for (const file of files) {
    dates.add(file.date);
  }
  return Array.from(dates).sort((a, b) => (a < b ? 1 : a > b ? -1 : 0));
};

export const getLogFilePath = (type: LogViewerType, date: string): { filePath: string; fileName: string } => {
  const { dir, base } = resolveTarget(type);
  const safeDate = assertValidDate(date);
  const fallbackFileName = `${base}.${safeDate}.log`;
  const files = fs
    .readdirSync(dir)
    .map(fileName => parseLogFile(base, dir, fileName))
    .filter((item): item is ResolvedLogFile => item !== null);
  const matchedFiles = sortByRotationForPreferredFile(files.filter(file => file.date === safeDate));
  if (!matchedFiles[0]) {
    return { filePath: path.join(dir, fallbackFileName), fileName: fallbackFileName };
  }
  return { filePath: matchedFiles[0].filePath, fileName: matchedFiles[0].fileName };
};

export const readLogEntries = async (
  type: LogViewerType,
  date: string,
  options: { levels?: LogViewerLevel[]; keyword?: string; page?: number; pageSize?: number }
): Promise<LogViewerEntriesResponse> => {
  const { dir, base } = resolveTarget(type);
  const safeDate = assertValidDate(date);
  const matchedFiles = sortByRotationForRead(
    (await listResolvedLogFiles(dir, base)).filter(file => file.date === safeDate)
  );
  if (!matchedFiles.length) {
    return { items: [], total: 0 };
  }
  const contents = await Promise.all(matchedFiles.map(file => readBoundedTail(file.filePath)));
  const content = contents.filter(Boolean).join('\n');
  const entries = parseLogContent(content);
  return queryEntries(entries, options);
};
