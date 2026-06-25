import fs from 'fs';
import os from 'os';
import path from 'path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { deleteExpiredLogs } from '../log-maintenance';

describe('deleteExpiredLogs', () => {
  let rootDir: string;

  beforeEach(async () => {
    rootDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'volix-log-'));
  });

  afterEach(async () => {
    await fs.promises.rm(rootDir, { recursive: true, force: true });
  });

  it('deletes log files older than retention and keeps recent ones', async () => {
    const now = Date.UTC(2025, 0, 20);
    const normalDir = path.join(rootDir, 'normal');
    await fs.promises.mkdir(normalDir, { recursive: true });
    const oldFile = path.join(normalDir, 'normal.2025-01-01.log');
    const freshFile = path.join(normalDir, 'normal.2025-01-18.log');
    await fs.promises.writeFile(oldFile, 'old');
    await fs.promises.writeFile(freshFile, 'fresh');

    const result = await deleteExpiredLogs({ rootDir, retentionDays: 10, now: () => now });

    expect(fs.existsSync(oldFile)).toBe(false);
    expect(fs.existsSync(freshFile)).toBe(true);
    expect(result.deletedFileCount).toBe(1);
    expect(result.retentionDays).toBe(10);
    expect(result.cutoffTime).toBe(Date.UTC(2025, 0, 10));
    expect(result.scannedDirectoryCount).toBe(1);
    expect(result.scannedFileCount).toBe(2);
    expect(result.deletedFiles).toEqual([oldFile]);
  });

  it('removes archive directories and their contents', async () => {
    const dbDir = path.join(rootDir, 'databse');
    const archiveDir = path.join(dbDir, 'archive');
    await fs.promises.mkdir(archiveDir, { recursive: true });
    await fs.promises.writeFile(path.join(archiveDir, 'database.2024.zip'), 'zip');

    const result = await deleteExpiredLogs({ rootDir, retentionDays: 10, now: () => Date.UTC(2025, 0, 20) });

    expect(fs.existsSync(archiveDir)).toBe(false);
    expect(result.removedArchiveDirCount).toBe(1);
  });
});
