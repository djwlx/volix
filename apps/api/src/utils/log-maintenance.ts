import fs from 'fs';
import path from 'path';
import { PATH } from './path';
import { LOG_RETENTION_DAYS_DEFAULT } from '../modules/user/service/system-setting.constants';

export const LOG_MAX_SIZE_BYTES = 200 * 1024 * 1024;
const LOG_MAINTENANCE_CHECK_INTERVAL_MS = 12 * 60 * 60 * 1000;
const LOG_DATE_REGEXP = /(\d{4}-\d{2}-\d{2})\.log$/;
const ARCHIVE_DIR_NAME = 'archive';

type DeleteExpiredLogsResult = {
  deletedFileCount: number;
  removedArchiveDirCount: number;
};
type LogMaintenanceTrigger = 'startup' | 'interval';
type RetentionProvider = () => Promise<number> | number;
type StartLogMaintenanceOptions = {
  onSuccess?: (result: DeleteExpiredLogsResult, trigger: LogMaintenanceTrigger) => void;
  onError?: (error: unknown, trigger: LogMaintenanceTrigger) => void;
};

let retentionProvider: RetentionProvider = () => LOG_RETENTION_DAYS_DEFAULT;

export const setLogRetentionProvider = (provider: RetentionProvider) => {
  retentionProvider = provider;
};

const parseLogDateFromFilename = (filename: string) => {
  const matched = filename.match(LOG_DATE_REGEXP);
  if (!matched?.[1]) {
    return null;
  }

  const parsed = new Date(`${matched[1]}T00:00:00.000Z`);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed.getTime();
};

const listLogDirectories = async (rootDir: string) => {
  try {
    const entries = await fs.promises.readdir(rootDir, { withFileTypes: true });
    return entries.filter(entry => entry.isDirectory()).map(entry => path.join(rootDir, entry.name));
  } catch {
    return [];
  }
};

export const deleteExpiredLogs = async (options: {
  retentionDays: number;
  rootDir?: string;
  now?: () => number;
}): Promise<DeleteExpiredLogsResult> => {
  const rootDir = options.rootDir || PATH.log;
  const now = options.now || (() => Date.now());
  const retentionDays = options.retentionDays;
  const cutoffTime = now() - retentionDays * 24 * 60 * 60 * 1000;
  const logDirs = await listLogDirectories(rootDir);
  let deletedFileCount = 0;
  let removedArchiveDirCount = 0;

  for (const logDir of logDirs) {
    const archiveDir = path.join(logDir, ARCHIVE_DIR_NAME);
    const archiveExisted = await fs.promises
      .access(archiveDir, fs.constants.F_OK)
      .then(() => true)
      .catch(() => false);
    if (archiveExisted) {
      await fs.promises.rm(archiveDir, { recursive: true, force: true });
      removedArchiveDirCount += 1;
    }

    const entries = await fs.promises.readdir(logDir, { withFileTypes: true }).catch(() => []);
    const expiredFiles = entries
      .filter(entry => entry.isFile() && entry.name.endsWith('.log'))
      .map(entry => ({
        fullPath: path.join(logDir, entry.name),
        time: parseLogDateFromFilename(entry.name),
      }))
      .filter((item): item is { fullPath: string; time: number } => item.time !== null && item.time <= cutoffTime);

    for (const file of expiredFiles) {
      await fs.promises.rm(file.fullPath, { force: true });
      deletedFileCount += 1;
    }
  }

  return {
    deletedFileCount,
    removedArchiveDirCount,
  };
};

let maintenanceStarted = false;

export const startLogMaintenance = (options?: StartLogMaintenanceOptions) => {
  if (maintenanceStarted) {
    return;
  }
  maintenanceStarted = true;

  const run = (trigger: LogMaintenanceTrigger) => {
    void Promise.resolve(retentionProvider())
      .then(retentionDays => deleteExpiredLogs({ retentionDays: retentionDays || LOG_RETENTION_DAYS_DEFAULT }))
      .then(result => {
        options?.onSuccess?.(result, trigger);
      })
      .catch(error => {
        options?.onError?.(error, trigger);
      });
  };

  run('startup');
  const timer = setInterval(() => {
    run('interval');
  }, LOG_MAINTENANCE_CHECK_INTERVAL_MS);
  timer.unref();
};
