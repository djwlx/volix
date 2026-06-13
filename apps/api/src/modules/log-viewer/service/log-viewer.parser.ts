import type { LogViewerEntriesResponse, LogViewerEntry, LogViewerLevel } from '@volix/types';

const LOG_HEADER_REGEXP = /^\[(.+?)\] \[(\w+)\] (.+?) - (.*)$/;
const DEFAULT_PAGE_SIZE = 50;
const MAX_PAGE_SIZE = 500;

const VALID_LEVELS: ReadonlySet<LogViewerLevel> = new Set<LogViewerLevel>([
  'trace',
  'debug',
  'info',
  'warn',
  'error',
  'fatal',
]);

export const normalizeLevel = (raw: string): LogViewerLevel => {
  const lower = raw.toLowerCase();
  return VALID_LEVELS.has(lower as LogViewerLevel) ? (lower as LogViewerLevel) : 'info';
};

export const parseLogContent = (content: string): LogViewerEntry[] => {
  const lines = content.split(/\r?\n/);
  const entries: LogViewerEntry[] = [];

  for (const line of lines) {
    const matched = line.match(LOG_HEADER_REGEXP);
    if (matched) {
      entries.push({
        timestamp: matched[1],
        level: normalizeLevel(matched[2]),
        category: matched[3],
        message: matched[4],
      });
      continue;
    }
    const last = entries[entries.length - 1];
    if (last) {
      last.message = `${last.message}\n${line}`;
    }
  }

  return entries.map(entry => ({ ...entry, message: entry.message.replace(/\n+$/, '') }));
};

export const queryEntries = (
  entries: LogViewerEntry[],
  options: { levels?: LogViewerLevel[]; keyword?: string; page?: number; pageSize?: number }
): LogViewerEntriesResponse => {
  const levelSet = options.levels && options.levels.length > 0 ? new Set(options.levels) : null;
  const keyword = (options.keyword || '').trim().toLowerCase();

  const filtered = entries.filter(entry => {
    if (levelSet && !levelSet.has(entry.level)) {
      return false;
    }
    if (keyword && !entry.message.toLowerCase().includes(keyword)) {
      return false;
    }
    return true;
  });

  const reversed = filtered.slice().reverse();
  const page = Math.max(1, Math.floor(options.page || 1));
  const pageSize = Math.min(MAX_PAGE_SIZE, Math.max(1, Math.floor(options.pageSize || DEFAULT_PAGE_SIZE)));
  const start = (page - 1) * pageSize;

  return {
    items: reversed.slice(start, start + pageSize),
    total: reversed.length,
  };
};
