import fs from 'fs';
import path from 'path';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { PATH } from './path';

const execFileAsync = promisify(execFile);

export const LOG_MAX_SIZE_BYTES = 200 * 1024 * 1024;
export const LOG_ARCHIVE_AFTER_DAYS = 5;
const LOG_ARCHIVE_CHECK_INTERVAL_MS = 12 * 60 * 60 * 1000;
const LOG_DATE_REGEXP = /(\d{4}-\d{2}-\d{2})\.log$/;

type ZipRunner = (archivePath: string, filePaths: string[]) => Promise<void>;

const defaultZipRunner: ZipRunner = async (archivePath, filePaths) => {
  if (filePaths.length === 0) {
    return;
  }

  await fs.promises.mkdir(path.dirname(archivePath), { recursive: true });
  await execFileAsync('zip', ['-j', archivePath, ...filePaths]);
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

  return {
    dateText: matched[1],
    time: parsed.getTime(),
  };
};

const listLogDirectories = async (rootDir: string) => {
  try {
    const entries = await fs.promises.readdir(rootDir, { withFileTypes: true });
    return entries.filter(entry => entry.isDirectory()).map(entry => path.join(rootDir, entry.name));
  } catch {
    return [];
  }
};

const ensureArchivePath = async (archiveDir: string, archiveBaseName: string) => {
  let archivePath = path.join(archiveDir, `${archiveBaseName}.zip`);
  let suffix = 1;

  // Keep old archive batches immutable; if the same range appears again,
  // create a numbered sibling archive instead of overwriting.
  while (
    await fs.promises
      .access(archivePath, fs.constants.F_OK)
      .then(() => true)
      .catch(() => false)
  ) {
    archivePath = path.join(archiveDir, `${archiveBaseName}.${suffix}.zip`);
    suffix += 1;
  }

  return archivePath;
};

export const archiveExpiredLogs = async (options?: { rootDir?: string; now?: () => number; zipRunner?: ZipRunner }) => {
  const rootDir = options?.rootDir || PATH.log;
  const now = options?.now || (() => Date.now());
  const zipRunner = options?.zipRunner || defaultZipRunner;
  const cutoffTime = now() - LOG_ARCHIVE_AFTER_DAYS * 24 * 60 * 60 * 1000;
  const logDirs = await listLogDirectories(rootDir);

  for (const logDir of logDirs) {
    const archiveDir = path.join(logDir, 'archive');
    const entries = await fs.promises.readdir(logDir, { withFileTypes: true }).catch(() => []);
    const expiredFiles = entries
      .filter(entry => entry.isFile() && entry.name.endsWith('.log'))
      .map(entry => ({
        name: entry.name,
        fullPath: path.join(logDir, entry.name),
        parsedDate: parseLogDateFromFilename(entry.name),
      }))
      .filter(item => item.parsedDate && item.parsedDate.time <= cutoffTime);

    if (!expiredFiles.length) {
      continue;
    }

    const datedFiles = expiredFiles
      .filter((item): item is typeof item & { parsedDate: NonNullable<typeof item.parsedDate> } =>
        Boolean(item.parsedDate?.dateText)
      )
      .sort((a, b) => a.parsedDate.time - b.parsedDate.time);

    if (!datedFiles.length) {
      continue;
    }

    const fromDate = datedFiles[0].parsedDate.dateText;
    const toDate = datedFiles[datedFiles.length - 1].parsedDate.dateText;
    const logType = path.basename(logDir);
    const archiveBaseName = `${logType}.${fromDate}_to_${toDate}`;
    const archivePath = await ensureArchivePath(archiveDir, archiveBaseName);
    const filePaths = datedFiles.map(item => item.fullPath);

    await zipRunner(archivePath, filePaths);
    await Promise.all(filePaths.map(filePath => fs.promises.rm(filePath, { force: true })));
  }
};

let maintenanceStarted = false;

export const startLogMaintenance = () => {
  if (maintenanceStarted) {
    return;
  }
  maintenanceStarted = true;

  void archiveExpiredLogs().catch(() => undefined);
  const timer = setInterval(() => {
    void archiveExpiredLogs().catch(() => undefined);
  }, LOG_ARCHIVE_CHECK_INTERVAL_MS);
  timer.unref();
};
