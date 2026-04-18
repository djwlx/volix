import fs from 'fs';
import os from 'os';
import path from 'path';
import {
  archiveExpiredLogs,
  LOG_ARCHIVE_AFTER_DAYS,
  LOG_MAX_SIZE_BYTES,
} from '../../apps/api/src/utils/log-maintenance';

describe('log maintenance', () => {
  test('archives expired logs into a single date-range zip and keeps recent files in place', async () => {
    const tempDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'volix-log-maintenance-'));
    const taskDir = path.join(tempDir, 'task');
    await fs.promises.mkdir(taskDir, { recursive: true });

    const expiredDateA = '2026-04-01';
    const expiredDateB = '2026-04-12';
    const freshDate = '2026-04-18';
    const expiredLogA = path.join(taskDir, `task.${expiredDateA}.log`);
    const expiredLogB = path.join(taskDir, `task.${expiredDateB}.log`);
    const freshLog = path.join(taskDir, `task.${freshDate}.log`);
    await fs.promises.writeFile(expiredLogA, 'expired-log-a', 'utf8');
    await fs.promises.writeFile(expiredLogB, 'expired-log-b', 'utf8');
    await fs.promises.writeFile(freshLog, 'fresh-log', 'utf8');

    const archived: Array<{ archivePath: string; filePaths: string[] }> = [];
    await archiveExpiredLogs({
      rootDir: tempDir,
      now: () => new Date('2026-04-18T12:00:00.000Z').getTime(),
      zipRunner: async (archivePath, filePaths) => {
        archived.push({ archivePath, filePaths: [...filePaths] });
        await fs.promises.mkdir(path.dirname(archivePath), { recursive: true });
        await fs.promises.writeFile(archivePath, `zip:${filePaths.join(',')}`, 'utf8');
      },
    });

    expect(LOG_ARCHIVE_AFTER_DAYS).toBe(5);
    expect(LOG_MAX_SIZE_BYTES).toBe(200 * 1024 * 1024);
    expect(archived).toHaveLength(1);
    expect(archived[0]?.archivePath.endsWith(path.join('archive', `task.${expiredDateA}_to_${expiredDateB}.zip`))).toBe(
      true
    );
    expect(archived[0]?.filePaths).toEqual([expiredLogA, expiredLogB]);

    await expect(fs.promises.access(expiredLogA)).rejects.toBeDefined();
    await expect(fs.promises.access(expiredLogB)).rejects.toBeDefined();
    await expect(fs.promises.access(freshLog)).resolves.toBeUndefined();
    await expect(
      fs.promises.access(path.join(taskDir, 'archive', `task.${expiredDateA}_to_${expiredDateB}.zip`))
    ).resolves.toBeUndefined();

    await fs.promises.rm(tempDir, { recursive: true, force: true });
  });
});
