import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { PATH } from '../../../utils/path';

export interface OpenlistDirectoryCacheEntry<TEntry = unknown> {
  path: string;
  updatedAt: string;
  entries: TEntry[];
}

const normalizeTaskCacheKey = (taskId?: string) => String(taskId || '').trim() || 'shared';

const hashCachePath = (targetPath: string) => crypto.createHash('sha1').update(targetPath).digest('hex');

export const getOpenlistAiOrganizerTaskCacheDir = (taskId?: string) =>
  path.join(PATH.openlistAiOrganizerCache, normalizeTaskCacheKey(taskId));

export const getOpenlistAiOrganizerDirectoryCacheFile = (taskId: string | undefined, targetPath: string) =>
  path.join(getOpenlistAiOrganizerTaskCacheDir(taskId), `${hashCachePath(targetPath)}.json`);

export const readOpenlistDirectoryCacheEntry = async <TEntry = unknown>(
  taskId: string | undefined,
  targetPath: string
) => {
  const cacheFile = getOpenlistAiOrganizerDirectoryCacheFile(taskId, targetPath);
  try {
    const raw = await fs.promises.readFile(cacheFile, 'utf8');
    const parsed = JSON.parse(raw) as OpenlistDirectoryCacheEntry<TEntry>;
    if (!parsed || typeof parsed !== 'object' || parsed.path !== targetPath || !Array.isArray(parsed.entries)) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
};

export const writeOpenlistDirectoryCacheEntry = async <TEntry = unknown>(
  taskId: string | undefined,
  entry: OpenlistDirectoryCacheEntry<TEntry>
) => {
  const cacheDir = getOpenlistAiOrganizerTaskCacheDir(taskId);
  const cacheFile = getOpenlistAiOrganizerDirectoryCacheFile(taskId, entry.path);
  await fs.promises.mkdir(cacheDir, { recursive: true });
  await fs.promises.writeFile(cacheFile, JSON.stringify(entry, null, 2), 'utf8');
  return cacheFile;
};

export const cleanupOpenlistAiOrganizerTaskCache = async (taskId?: string) => {
  const cacheDir = getOpenlistAiOrganizerTaskCacheDir(taskId);
  await fs.promises.rm(cacheDir, { recursive: true, force: true });
};
