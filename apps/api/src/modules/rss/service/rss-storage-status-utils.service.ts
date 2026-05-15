import fs from 'fs';
import path from 'path';

const DEFAULT_REFRESH_INTERVAL_MINUTES = 5;
const MIN_REFRESH_INTERVAL_MINUTES = 1;
const MAX_REFRESH_INTERVAL_MINUTES = 24 * 60;

export const getPathUsage = async (targetPath: string): Promise<{ sizeBytes: number; fileCount: number }> => {
  const stat = await fs.promises.stat(targetPath).catch(() => null);
  if (!stat) {
    return { sizeBytes: 0, fileCount: 0 };
  }
  if (stat.isFile()) {
    return { sizeBytes: Number(stat.size || 0), fileCount: 1 };
  }
  if (!stat.isDirectory()) {
    return { sizeBytes: 0, fileCount: 0 };
  }
  const entries = await fs.promises.readdir(targetPath, { withFileTypes: true }).catch(() => [] as fs.Dirent[]);
  const children = await Promise.all(entries.map(item => getPathUsage(path.join(targetPath, item.name))));
  return children.reduce(
    (acc, item) => ({
      sizeBytes: acc.sizeBytes + item.sizeBytes,
      fileCount: acc.fileCount + item.fileCount,
    }),
    { sizeBytes: 0, fileCount: 0 }
  );
};

export const parseRefreshIntervalMinutes = (value: unknown) => {
  const raw = Number(value);
  if (!Number.isFinite(raw)) {
    return DEFAULT_REFRESH_INTERVAL_MINUTES;
  }
  return Math.min(MAX_REFRESH_INTERVAL_MINUTES, Math.max(MIN_REFRESH_INTERVAL_MINUTES, Math.round(raw)));
};

export const normalizeIsoTime = (value: unknown) => {
  const text = String(value || '').trim();
  if (!text) {
    return '';
  }
  const timestamp = Date.parse(text);
  if (Number.isNaN(timestamp)) {
    return '';
  }
  return new Date(timestamp).toISOString();
};

export const addMinutesToIsoTime = (time: string, minutes: number) => {
  const base = Date.parse(String(time || ''));
  if (Number.isNaN(base)) {
    return '';
  }
  return new Date(base + Math.max(1, Math.floor(minutes)) * 60 * 1000).toISOString();
};
